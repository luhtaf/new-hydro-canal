/**
 * Route config slice `users` (admin-only). Route `/users` → UsersList.
 *
 * Lazy import (PLAN-FE: lazy routes + Suspense) supaya bundle kecil. Gating role
 * admin lewat meta `handle.requireRole` (dibaca ProtectedRoute slice [auth]).
 * Slice router meng-spread `usersRoutes` ke children RootLayout (lihat field wiring).
 */
import type { RouteObject } from 'react-router-dom';

type AdminRoute = RouteObject & { handle?: { requireRole?: 'admin' | 'operator' } };

export const usersRoutes: AdminRoute[] = [
  {
    path: '/users',
    handle: { requireRole: 'admin' },
    lazy: async () => ({ Component: (await import('./UsersList.js')).default }),
  },
];
