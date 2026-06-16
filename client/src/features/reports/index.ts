/**
 * Barrel publik slice [reports].
 *
 * Page utama = default export `ReportsPage` (diwire di router sebagai `/reports`
 * di bawah <RequireAdmin>). Slice lain umumnya TIDAK impor dari sini (reports =
 * konsumen agregasi, bukan provider); barrel untuk konsistensi + reuse hooks bila
 * ada KPI yang mau dipakai ulang.
 */
export { default as ReportsPage } from './ReportsPage.js';
export {
  useReportKpi,
  useReportTrend,
  useReportRegion,
  useReportOperator,
  useReportBreakdown,
  reportKeys,
} from './hooks.js';
export type {
  ReportKpi,
  TrendPoint,
  RegionStat,
  OperatorStat,
  QualityBreakdown,
  ReportPeriod,
  TrendGroupBy,
} from './api.js';
