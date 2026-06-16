/**
 * API client slice [reports] — wrapper axios di atas `[auth]` apiClient (reuse
 * interceptor 401→app-lock; JANGAN bikin instance baru). Semua endpoint admin-only
 * (server guard), read-only agregasi.
 *
 * DTO di sini diduplikat identik dari BE `server/.../reports/reports.types.ts`
 * (FE self-contained di TS strict, pola types.ts shared). Kalau ubah satu, ubah dua.
 */
import { apiClient } from '../auth/api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Tipe wire (kontrak dgn slice be-reports)
// ─────────────────────────────────────────────────────────────────────────────

export type ReportPeriod = 7 | 30 | 90;
export type TrendGroupBy = 'day' | 'week';

export interface ReportKpi {
  totalQc: number;
  totalQcDelta: number;
  passRate: number;
  passRateDelta: number;
  reqcRatio: number;
  reqcRatioDelta: number;
  avgHours: number;
}

export interface TrendPoint {
  date: string;
  done: number;
  pass: number;
  passRate: number;
}

export interface RegionStat {
  region: string;
  done: number;
  pass: number;
  passRate: number;
}

export interface OperatorStat {
  userId: string;
  name: string;
  initials: string;
  usv: string | null;
  kanal: number;
  passRate: number;
  reqcRatio: number;
}

export interface QualityBreakdown {
  pass: number;
  tolerance: number;
  fail: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint
// ─────────────────────────────────────────────────────────────────────────────

const params = (period: ReportPeriod, extra?: Record<string, string>) => ({
  params: { period, ...extra },
});

export const reportsApi = {
  async kpi(period: ReportPeriod): Promise<ReportKpi> {
    const { data } = await apiClient.get<ReportKpi>('/reports/kpi', params(period));
    return data;
  },
  async trend(period: ReportPeriod, groupBy: TrendGroupBy = 'day'): Promise<TrendPoint[]> {
    const { data } = await apiClient.get<TrendPoint[]>(
      '/reports/trend',
      params(period, { groupBy }),
    );
    return Array.isArray(data) ? data : [];
  },
  async perRegion(period: ReportPeriod): Promise<RegionStat[]> {
    const { data } = await apiClient.get<RegionStat[]>('/reports/per-region', params(period));
    return Array.isArray(data) ? data : [];
  },
  async perOperator(period: ReportPeriod): Promise<OperatorStat[]> {
    const { data } = await apiClient.get<OperatorStat[]>('/reports/per-operator', params(period));
    return Array.isArray(data) ? data : [];
  },
  async breakdown(period: ReportPeriod): Promise<QualityBreakdown> {
    const { data } = await apiClient.get<QualityBreakdown>('/reports/breakdown', params(period));
    return data;
  },
};
