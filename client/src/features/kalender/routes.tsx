/**
 * Route config slice `kalender` (PLAN-FE page 3, route `/kalender`).
 * Lazy import per PLAN-FE (lazy routes + Suspense) supaya bundle kecil.
 *
 * Slice router meng-spread `kalenderRoutes` ke children RootLayout. Tidak ada
 * role gating (semua user lihat kalender; konten event nanti difilter per role).
 */
import type { RouteObject } from 'react-router-dom';

export const kalenderRoutes: RouteObject[] = [
  {
    path: '/kalender',
    lazy: async () => ({ Component: (await import('./KalenderPage.js')).default }),
  },
];
