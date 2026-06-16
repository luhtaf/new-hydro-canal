/**
 * Route config slice `distrik` (admin-only). Route `/distrik` → DistrikList.
 *
 * Lazy import (PLAN-FE: lazy routes + Suspense) supaya bundle kecil. Gating role
 * admin lewat meta `handle.requireRole` (dibaca RouteRoleGuard slice [auth]).
 * Slice router meng-spread `distrikRoutes` ke children RootLayout (lihat field wiring),
 * MENGGANTI placeholder `/distrik` yang lama.
 */
import type { RouteObject } from 'react-router-dom';

type AdminRoute = RouteObject & { handle?: { requireRole?: 'admin' | 'operator' } };

export const distrikRoutes: AdminRoute[] = [
  {
    path: '/distrik',
    handle: { requireRole: 'admin' },
    lazy: async () => ({ Component: (await import('./DistrikList.js')).default }),
  },
];
