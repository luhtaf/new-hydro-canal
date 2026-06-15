/**
 * Route config slice `data` (PLAN-FE "PORT EXISTING APP LAMA").
 * Semua di bawah `/admin/*` — entrypoint admin CRUD raw (requireRole: 'admin').
 * Pakai lazy import per page (PLAN-FE: lazy routes + Suspense) supaya bundle kecil.
 *
 * Slice router/layout meng-spread `dataRoutes` ke dalam children RootLayout.
 * Gating role admin di-handle ProtectedRoute (auth) lewat meta `requireRole`.
 */
import type { RouteObject } from 'react-router-dom';

/** Meta tambahan untuk per-route role gating (dibaca ProtectedRoute slice auth). */
type AdminRoute = RouteObject & { handle?: { requireRole?: 'admin' | 'operator' } };

const adminHandle = { requireRole: 'admin' as const };

export const dataRoutes: AdminRoute[] = [
  {
    path: '/admin/maindata',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./MainDataList.js')).default }),
  },
  {
    path: '/admin/maindata/add',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./AddMainData.js')).default }),
  },
  {
    path: '/admin/maindata/:id/edit',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./EditMainData.js')).default }),
  },
  {
    path: '/admin/data/:id',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./DataList.js')).default }),
  },
  {
    path: '/admin/data/:id/add',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./AddData.js')).default }),
  },
  {
    path: '/admin/data/:id/edit',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./EditData.js')).default }),
  },
  {
    path: '/admin/data/:id/chart',
    lazy: async () => ({ Component: (await import('./ChartData.js')).default }),
  },
  {
    path: '/admin/data/:id/chart/preview',
    lazy: async () => ({ Component: (await import('./ChartPreview.js')).default }),
  },
  {
    path: '/admin/data/:id/detail',
    lazy: async () => ({ Component: (await import('./DetailDataList.js')).default }),
  },
  {
    path: '/admin/data/:id/detail/add',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./AddDetailData.js')).default }),
  },
  {
    path: '/admin/data/:id/detail/:detailId/edit',
    handle: adminHandle,
    lazy: async () => ({ Component: (await import('./EditDetailData.js')).default }),
  },
  {
    path: '/admin/data/:id/detail/:detailId/chart',
    lazy: async () => ({ Component: (await import('./ChartDetailData.js')).default }),
  },
];
