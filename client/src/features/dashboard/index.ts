/**
 * Barrel publik slice `dashboard`.
 *
 * Page utama = default export `DashboardPage` (diwire di router sebagai index `/`).
 * Slice lain umumnya TIDAK impor dari sini (dashboard = konsumen, bukan provider);
 * barrel ada untuk konsistensi + akses hooks bila reuse KPI di tempat lain.
 */
export { default as DashboardPage } from './DashboardPage.js';
export {
  useRecentActivity,
  useDashboardDerived,
  dashboardKeys,
  segmentToTask,
} from './hooks.js';
export type {
  DashboardKpi,
  DashboardDerived,
  QcRow,
  QcClass,
  TaskRow,
} from './hooks.js';
