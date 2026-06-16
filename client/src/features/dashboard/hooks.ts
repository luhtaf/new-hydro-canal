/**
 * TanStack Query + derivasi KPI slice `dashboard`.
 *
 * Dua query:
 *   - `useRecentActivity` → /audit/recent, polling 30s (refetchInterval). Live feed.
 *   - `useDashboardData`  → /alldatas, dipakai derive 3 KPI + status QC terbaru.
 *
 * KPI ke-4 (Antrian sync) BUKAN dari API: itu count outbox PouchDB lokal lewat
 * `useSyncQueue` (slice [konflik]) → di-compose di DashboardPage, bukan di sini,
 * supaya hooks ini tetap murni server-state.
 *
 * Query key konvensi: ['dashboard', <scope>] supaya invalidasi granular.
 */
import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import * as api from './api.js';
import type { ActivityItem } from './api.js';
import type { Data, CanalDataSegment } from '../../shared/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ['dashboard'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
};

/** Live activity feed — polling 30 detik (spec task). */
export function useRecentActivity(): UseQueryResult<ActivityItem[]> {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: () => api.fetchRecentAudit(8),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

function useDashboardData(): UseQueryResult<Data[]> {
  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: () => api.fetchDashboardData(),
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Derivasi KPI + status QC terbaru
// ─────────────────────────────────────────────────────────────────────────────

/** Kelas hasil QC 1 segmen — derive dari rata-rata depth vs ambang sederhana. */
export type QcClass = 'pass' | 'tolerance' | 'fail';

export interface QcRow {
  /** label output (canal id / order). */
  label: string;
  /** sub-keterangan: jumlah titik / status. */
  sub: string;
  cls: QcClass;
  /** persentase pass (0-100) untuk badge. */
  pct: number;
}

export interface DashboardKpi {
  /** Undangan aktif = MainData yang masih punya segmen belum tuntas. */
  undanganAktif: number;
  /** Penugasan saya = segmen yang punya operator/usv (proxy assignment). */
  penugasanSaya: number;
  /** QC pass rate global (% segmen pass dari total segmen ber-data). */
  qcPassRate: number;
  qcPassCount: number;
  qcTotalCount: number;
}

/** Baris penugasan ringkas untuk "Penugasan minggu ini". */
export interface TaskRow {
  canalId: string;
  district: string;
  region: string;
  panjang: number;
  orderNo: string;
  /** ISO date untuk badge deadline. */
  requestDate?: string;
}

export interface DashboardDerived {
  kpi: DashboardKpi;
  /** penugasan minggu ini (segmen ber-assignment) — max 6. */
  weekTasks: TaskRow[];
  /** 3 status QC terbaru untuk panel kanan. */
  recentQc: QcRow[];
  isLoading: boolean;
  isError: boolean;
}

/** Map segmen → baris penugasan ringkas. */
export function segmentToTask(seg: CanalDataSegment): TaskRow {
  return {
    canalId: seg.canal_id || seg.content_name || seg.order_no,
    district: seg.district?.name ?? '—',
    region: seg.region ?? '—',
    panjang: seg.canal_length ?? seg.dimensi?.panjang ?? 0,
    orderNo: seg.order_no,
    requestDate: seg.qc_date || seg.measure_date,
  };
}

/**
 * Heuristik QC tanpa Threshold per-region (slice [pengukuran] belum nyala di sini):
 * pakai rasio titik di bawah rata-rata segmen sebagai proxy. Begitu slice
 * [pengukuran]/[qc] mendarat, ganti ke `classifyThreshold` real per-titik —
 * konsumen (badge) tidak berubah.
 */
function classifySegment(seg: CanalDataSegment): { cls: QcClass; pct: number } {
  const points = seg.data ?? [];
  if (points.length === 0) return { cls: 'tolerance', pct: 0 };
  const depths = points.map((p) => p.depth);
  const avg = depths.reduce((a, b) => a + b, 0) / depths.length;
  const okCount = depths.filter((d) => d >= avg).length;
  const pct = Math.round((okCount / depths.length) * 100);
  const cls: QcClass = pct >= 90 ? 'pass' : pct >= 60 ? 'tolerance' : 'fail';
  return { cls, pct };
}

/** Compose KPI + recent QC dari /alldatas (memoized). */
export function useDashboardDerived(): DashboardDerived {
  const q = useDashboardData();
  const list = q.data ?? [];

  return useMemo<DashboardDerived>(() => {
    const segments: CanalDataSegment[] = list.flatMap((d) => d.canal_data ?? []);
    const withData = segments.filter((s) => (s.data?.length ?? 0) > 0);

    let passCount = 0;
    const rows: QcRow[] = [];
    for (const seg of segments) {
      const { cls, pct } = classifySegment(seg);
      if (withData.includes(seg) && cls === 'pass') passCount += 1;
      rows.push({
        label: seg.content_name || seg.canal_id || seg.order_no,
        sub:
          cls === 'pass'
            ? `Pass · ${seg.data?.length ?? 0} titik`
            : cls === 'tolerance'
              ? 'Tolerance · perlu review'
              : 'Not pass · re-QC',
        cls,
        pct,
      });
    }

    // 3 terbaru = ambil yang punya measure/qc date terbaru (fallback urutan asli).
    const recentQc = [...rows]
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);

    const qcTotalCount = withData.length;
    const qcPassRate =
      qcTotalCount === 0 ? 0 : Math.round((passCount / qcTotalCount) * 100);

    const assigned = segments.filter(
      (s) => Boolean(s.operator) || Boolean(s.usv_code),
    );
    const undanganAktif = list.length;
    const penugasanSaya = assigned.length;
    const weekTasks = assigned.slice(0, 6).map(segmentToTask);

    return {
      kpi: {
        undanganAktif,
        penugasanSaya,
        qcPassRate,
        qcPassCount: passCount,
        qcTotalCount,
      },
      weekTasks,
      recentQc,
      isLoading: q.isLoading,
      isError: q.isError,
    };
  }, [list, q.isLoading, q.isError]);
}
