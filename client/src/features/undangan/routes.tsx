/**
 * Route config slice `undangan` (PLAN-FE 4/5/6).
 * Lazy import per page (bundle kecil). Slice router meng-spread `undanganRoutes`
 * ke children RootLayout. Gating admin (`/undangan/baru`) via handle.requireRole
 * (dibaca ProtectedRoute / RequireAdmin wrapper di slice layout/auth).
 *
 * Page diekspor default export → kompat dengan `lazy: () => ({ Component })`.
 */
import type { RouteObject } from 'react-router-dom';

type RoleRoute = RouteObject & { handle?: { requireRole?: 'admin' | 'operator' } };

export const undanganRoutes: RoleRoute[] = [
  {
    path: '/undangan',
    lazy: async () => ({ Component: (await import('./UndanganList.js')).default }),
  },
  {
    path: '/undangan/baru',
    handle: { requireRole: 'admin' },
    lazy: async () => ({ Component: (await import('./UndanganBaru.js')).default }),
  },
  {
    path: '/undangan/:orderNo',
    lazy: async () => ({ Component: (await import('./UndanganDetail.js')).default }),
  },
];
