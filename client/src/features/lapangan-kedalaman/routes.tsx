/**
 * Route config slice `lapangan-kedalaman`.
 * Flow operator lapangan (offline-first). requireRole: 'operator' (admin tetap
 * boleh masuk lewat fallback CRUD /admin). Lazy import (PLAN-FE: lazy + Suspense).
 *
 * Slice router/layout meng-spread `lapanganKedalamanRoutes` ke children RootLayout.
 */
import type { RouteObject } from 'react-router-dom';

type FieldRoute = RouteObject & { handle?: { requireRole?: 'admin' | 'operator' } };

export const lapanganKedalamanRoutes: FieldRoute[] = [
  {
    path: '/lapangan/kedalaman/:canalId',
    handle: { requireRole: 'operator' },
    lazy: async () => ({ Component: (await import('./KedalamanInput.js')).default }),
  },
];
