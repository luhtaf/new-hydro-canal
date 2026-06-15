/**
 * Route config slice `audit`. Admin-only (`/audit`). Lazy import (Suspense).
 *
 * Slice router meng-spread `auditRoutes` ke children RootLayout. Gating role:
 * router membungkus dgn <RequireAdmin> ATAU lewat `handle.requireRole`. Page export
 * default (konvensi lazy `Component`).
 */
import type { RouteObject } from 'react-router-dom';

type AdminRoute = RouteObject & {
  handle?: { requireRole?: 'admin' | 'operator' };
};

export const auditRoutes: AdminRoute[] = [
  {
    path: '/audit',
    handle: { requireRole: 'admin' },
    lazy: async () => ({ Component: (await import('./AuditLog.js')).default }),
  },
];
