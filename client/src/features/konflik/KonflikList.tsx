/**
 * KonflikList — page /konflik. Daftar konflik sync + resolusi.
 *
 * Demo ref: index.html template view-konflik + app.js triggerConflict/resolveConflict.
 * Dua jenis kartu: single-field (depth) & multi-field (parameter). Saat resolve:
 * animasi slide-out → tulis doc hasil resolusi lewat sync engine (jalur tulis)
 * → hapus dari daftar konflik.
 *
 * Konflik nyata datang dari sync engine (push ditolak, lihat shared/db/sync.ts).
 * Tombol "Trigger konflik baru" (ConflictTrigger) hanya untuk demo/testing.
 */
import { useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import { useConflicts } from './useConflicts.js';
import { SingleFieldResolver } from './SingleFieldResolver.js';
import { MultiFieldResolver } from './MultiFieldResolver.js';
import { ConflictTrigger } from './ConflictTrigger.js';
import { resolveSingle, resolveMulti, remove, type Side } from '../../shared/db/conflict.js';
import { applyResolution } from '../../shared/db/sync.js';
import { useAuthStore } from '../auth/store.js';
import { toast } from '../../shared/stores/ui.js';
import type { ConflictItem, SyncDoc } from '../../shared/types.js';

const EXIT_MS = 220; // sinkron dengan .animate-slide-out

export function KonflikList() {
  const conflicts = useConflicts();
  const activeUserId = useAuthStore((s) => s.activeUserId);
  // docId yang sedang animasi keluar (jangan render ulang sbg aktif).
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const finalize = async (c: ConflictItem, resolved: SyncDoc, msg: string) => {
    setExiting((s) => new Set(s).add(c.docId));
    // Tulis hasil resolusi lewat jalur tulis tunggal (push ulang ke server).
    if (activeUserId) {
      try {
        await applyResolution(activeUserId, resolved);
      } catch {
        /* offline → tetap masuk outbox via writeDoc; abaikan error sini */
      }
    }
    toast(msg, 'ok');
    setTimeout(() => {
      remove(c.docId);
      setExiting((s) => {
        const n = new Set(s);
        n.delete(c.docId);
        return n;
      });
    }, EXIT_MS);
  };

  const onSingle = (c: ConflictItem, pick: Side) =>
    void finalize(c, resolveSingle(c, pick), 'Konflik diselesaikan · perubahan disinkronkan.');

  const onMulti = (c: ConflictItem, picks: Record<string, Side>) =>
    void finalize(c, resolveMulti(c, picks), 'Konflik digabungkan · perubahan disinkronkan.');

  const onDefer = (c: ConflictItem) => {
    remove(c.docId);
    toast('Konflik ditangguhkan — akan muncul lagi saat sync berikutnya.', 'info');
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Konflik sinkronisasi</h1>
          <p className="text-sm text-slate-600 mt-1">
            Dokumen yang diedit di lebih dari satu perangkat saat offline. Pilih versi
            yang akan disimpan.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Demo only — di produksi konflik datang otomatis dari sync engine. */}
          <ConflictTrigger />
        </div>
      </header>

      {conflicts.length === 0 ? (
        <EmptyKonflik />
      ) : (
        <div className="space-y-3">
          {conflicts.map((c) => {
            const cls = exiting.has(c.docId) ? 'animate-slide-out' : 'animate-slide-up';
            return (
              <div key={c.docId} className={cls}>
                {c.type === 'parameter' ? (
                  <MultiFieldResolver
                    conflict={c}
                    resolving={exiting.has(c.docId)}
                    onResolve={(picks) => onMulti(c, picks)}
                    onDefer={() => onDefer(c)}
                  />
                ) : (
                  <SingleFieldResolver
                    conflict={c}
                    resolving={exiting.has(c.docId)}
                    onResolve={(pick) => onSingle(c, pick)}
                    onDefer={() => onDefer(c)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info strategi default (spec § D). */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex gap-3">
        <Icon name="info" className="w-5 h-5 text-brand-600 shrink-0" />
        <div className="text-sm text-brand-900">
          <div className="font-semibold mb-1">Strategi default</div>
          <div className="text-brand-800 text-[13px] leading-relaxed">
            Saat sync: <b>last-write-wins</b> untuk parameter (timestamp), dan{' '}
            <b>per-titik manual</b> untuk data kedalaman karena drag-edit sering kolisi.
            Field admin (status/assignment/threshold) selalu <b>server-wins</b>. Bisa
            diubah di{' '}
            <a href="#/pengaturan" className="font-semibold underline">
              Pengaturan
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyKonflik() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-soft text-center py-14">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 grid place-items-center mx-auto mb-3 text-emerald-500">
        <Icon name="cloud-check" className="w-7 h-7" />
      </div>
      <div className="font-semibold text-slate-800">Tidak ada konflik</div>
      <div className="text-sm text-slate-500 mt-1">
        Semua perubahan tersinkron rapi. Konflik muncul kalau dokumen sama diedit di
        dua perangkat.
      </div>
    </div>
  );
}
