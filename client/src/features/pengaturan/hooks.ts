/**
 * Hooks slice `pengaturan`.
 *
 * Tiga kelompok:
 *   1. Threshold — TanStack Query (server singleton) + draft lokal untuk slider live.
 *      Draft dipisah dari server-state supaya re-color chart realtime tanpa nunggu
 *      network; "Simpan" baru commit ke server (admin-only).
 *   2. Penyimpanan lokal — statistik PouchDB akun aktif (size/doc count/sync terakhir)
 *      via Storage API + allDocs + meta sync. Aksi: sinkron paksa / reset lokal.
 *   3. Pengaturan app — toggle non-threshold (autoSync) di store kecil persist.
 *
 * Query key: ['pengaturan', <scope>].
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';
import { DEFAULT_THRESHOLD } from './api.js';
import {
  getPouch,
  destroyPouch,
  getSyncMeta,
  OUTBOX_PREFIX,
} from '../../shared/db/pouch.js';
import { syncNow } from '../../shared/db/sync.js';
import { useAuthStore } from '../auth/store.js';
import { toast } from '../../shared/stores/ui.js';
import type { Threshold } from '../../shared/types.js';

export const pengaturanKeys = {
  all: ['pengaturan'] as const,
  threshold: () => [...pengaturanKeys.all, 'threshold'] as const,
  storage: (userId: string | null) =>
    [...pengaturanKeys.all, 'storage', userId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Threshold — server query + draft lokal (slider live)
// ─────────────────────────────────────────────────────────────────────────────

/** Query threshold server (fallback DEFAULT saat null/offline). */
export function useThresholdQuery(): UseQueryResult<Threshold> {
  return useQuery({
    queryKey: pengaturanKeys.threshold(),
    queryFn: async () => (await api.fetchThreshold()) ?? DEFAULT_THRESHOLD,
    staleTime: 5 * 60_000,
  });
}

export interface ThresholdEditor {
  /** Nilai draft yang sedang diedit (sumber kebenaran UI slider/input/preview). */
  draft: Threshold;
  /** True kalau draft beda dari nilai server (tombol Simpan aktif). */
  dirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  /** Patch sebagian field draft (clamp + sinkron relasi batas). */
  patch: (p: Partial<Threshold>) => void;
  /** Set khusus dari slider "lulus" — geser batasAkhir & batasAwal seperti demo. */
  setLulusFromSlider: (lulus: number) => void;
  /** Commit ke server (admin-only). Toast hasil. */
  save: () => void;
  /** Kembalikan draft ke nilai server. */
  reset: () => void;
}

/**
 * Editor threshold: gabung server-state + draft lokal. Draft di-seed dari server
 * sekali saat data datang; perubahan slider/input hanya menyentuh draft (live,
 * no network). Save → mutation PUT + isi cache.
 *
 * Catatan demo (renderPengaturan): menggeser slider "lulus" ikut menggeser
 * `batasAkhir = lulus` dan `batasAwal = tidakLulus`. Perilaku itu dipertahankan.
 */
export function useThresholdEditor(): ThresholdEditor {
  const qc = useQueryClient();
  const q = useThresholdQuery();
  const server = q.data ?? DEFAULT_THRESHOLD;

  const [draft, setDraft] = useState<Threshold>(server);
  // seed draft saat server datang / berubah (mis. setelah pull) — hanya kalau
  // user belum mengedit (draft == server lama). Simpel: seed saat fetch sukses.
  useEffect(() => {
    if (q.data) setDraft(q.data);
  }, [q.data]);

  const mutation = useMutation({
    mutationFn: (t: Threshold) => api.saveThreshold(t),
    onSuccess: (saved) => {
      qc.setQueryData(pengaturanKeys.threshold(), saved);
      setDraft(saved);
      toast('Threshold tersimpan', 'ok');
    },
    onError: () => toast('Gagal menyimpan threshold — coba lagi saat online', 'warn'),
  });

  const patch = useCallback((p: Partial<Threshold>) => {
    setDraft((d) => clampThreshold({ ...d, ...p }));
  }, []);

  const setLulusFromSlider = useCallback((lulus: number) => {
    setDraft((d) =>
      clampThreshold({ ...d, lulus, batasAkhir: lulus, batasAwal: d.tidakLulus }),
    );
  }, []);

  const save = useCallback(() => mutation.mutate(draft), [mutation, draft]);
  const reset = useCallback(() => setDraft(server), [server]);

  const dirty = useMemo(() => !shallowEqualThreshold(draft, server), [draft, server]);

  return {
    draft,
    dirty,
    isLoading: q.isLoading,
    isSaving: mutation.isPending,
    patch,
    setLulusFromSlider,
    save,
    reset,
  };
}

/** Range valid threshold (m). Slider demo: 1.5–3.5. */
export const THRESHOLD_MIN = 1.5;
export const THRESHOLD_MAX = 3.5;

function clamp(v: number): number {
  if (Number.isNaN(v)) return THRESHOLD_MIN;
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, v));
}

/** Clamp tiap field ke range + jaga konsistensi minimal (tidakLulus ≤ lulus). */
export function clampThreshold(t: Threshold): Threshold {
  const lulus = clamp(t.lulus);
  const tidakLulus = clamp(t.tidakLulus);
  const batasAwal = clamp(t.batasAwal);
  const batasAkhir = clamp(t.batasAkhir);
  return { lulus, tidakLulus, batasAwal, batasAkhir };
}

function shallowEqualThreshold(a: Threshold, b: Threshold): boolean {
  return (
    a.lulus === b.lulus &&
    a.tidakLulus === b.tidakLulus &&
    a.batasAwal === b.batasAwal &&
    a.batasAkhir === b.batasAkhir
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Penyimpanan lokal — statistik PouchDB akun aktif
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalStats {
  /** byte terpakai (estimasi Storage API). null kalau tidak didukung. */
  usageBytes: number | null;
  /** byte kuota (estimasi). null kalau tidak didukung. */
  quotaBytes: number | null;
  /** jumlah doc data (exclude _design/_local/outbox). */
  docCount: number;
  /** jumlah op outbox belum terkirim. */
  pendingCount: number;
  /** ISO sync terakhir sukses (dari meta), null = belum pernah. */
  lastSyncedAt: string | null;
}

/** Hitung statistik PouchDB untuk satu akun. */
async function readLocalStats(userId: string): Promise<LocalStats> {
  const db = getPouch(userId);
  const info = await db.allDocs({ include_docs: false });
  let docCount = 0;
  let pendingCount = 0;
  for (const row of info.rows) {
    const id = row.id;
    if (id.startsWith('_design/') || id.startsWith('_local/')) continue;
    if (id.startsWith(OUTBOX_PREFIX)) {
      pendingCount += 1;
      continue;
    }
    docCount += 1;
  }

  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  if (
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    typeof navigator.storage.estimate === 'function'
  ) {
    try {
      const est = await navigator.storage.estimate();
      usageBytes = est.usage ?? null;
      quotaBytes = est.quota ?? null;
    } catch {
      /* tidak didukung — biarkan null */
    }
  }

  const meta = await getSyncMeta(userId);
  return {
    usageBytes,
    quotaBytes,
    docCount,
    pendingCount,
    lastSyncedAt: meta.lastSyncedAt,
  };
}

/** Statistik penyimpanan lokal akun aktif (refetch saat outbox berubah via invalidate). */
export function useLocalStats(): UseQueryResult<LocalStats> {
  const userId = useAuthStore((s) => s.activeUserId);
  return useQuery({
    queryKey: pengaturanKeys.storage(userId),
    queryFn: () => readLocalStats(userId as string),
    enabled: Boolean(userId),
    staleTime: 10_000,
  });
}

/** Aksi penyimpanan lokal: sinkron paksa, reset lokal. */
export function useLocalActions(): {
  forceSync: () => Promise<void>;
  resetLocal: () => Promise<void>;
  isSyncing: boolean;
} {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.activeUserId);
  const [isSyncing, setSyncing] = useState(false);

  const forceSync = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      await syncNow();
      toast('Sinkron selesai', 'ok');
    } catch {
      toast('Sinkron gagal — perangkat offline?', 'warn');
    } finally {
      setSyncing(false);
      qc.invalidateQueries({ queryKey: pengaturanKeys.storage(userId) });
    }
  }, [userId, qc]);

  const resetLocal = useCallback(async () => {
    if (!userId) return;
    try {
      await destroyPouch(userId);
      toast('Data lokal dihapus. Re-seed saat online berikutnya.', 'ok');
    } catch {
      toast('Gagal menghapus data lokal', 'warn');
    } finally {
      qc.invalidateQueries({ queryKey: pengaturanKeys.storage(userId) });
    }
  }, [userId, qc]);

  return { forceSync, resetLocal, isSyncing };
}
