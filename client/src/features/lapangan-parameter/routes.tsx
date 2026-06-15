/**
 * Route config slice `lapangan-parameter` (PLAN-FE: flow lapangan operator).
 * Route operator-only di bawah `/lapangan/*`. Lazy import (Suspense) supaya
 * bundle kecil. Slice router/layout meng-spread `lapanganParameterRoutes` ke
 * children RootLayout; gating role di ProtectedRoute lewat meta `requireRole`.
 */
import type { RouteObject } from 'react-router-dom';

type OperatorRoute = RouteObject & {
  handle?: { requireRole?: 'admin' | 'operator' };
};

export const lapanganParameterRoutes: OperatorRoute[] = [
  {
    path: '/lapangan/parameter/:canalId',
    handle: { requireRole: 'operator' },
    lazy: async () => ({ Component: (await import('./ParameterForm.js')).default }),
  },
];
