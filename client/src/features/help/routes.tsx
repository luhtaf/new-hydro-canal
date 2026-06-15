/**
 * Route config slice `help`. Single route `/help` (lihat semua role).
 * Lazy import (PLAN-FE: lazy routes + Suspense). Router/layout meng-spread
 * `helpRoutes` ke children RootLayout. Tidak ada role gating — bantuan publik.
 */
import type { RouteObject } from 'react-router-dom';

export const helpRoutes: RouteObject[] = [
  {
    path: '/help',
    lazy: async () => ({ Component: (await import('./HelpPage.js')).default }),
  },
];
