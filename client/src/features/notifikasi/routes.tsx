/**
 * Route config slice `notifikasi` (PLAN-FE page 16, route `/notifikasi`).
 * Lazy import (lazy routes + Suspense) supaya bundle kecil.
 *
 * Tanpa role gating — semua user punya inbox sendiri (notif ter-scope userId di server).
 * Router shell meng-spread `notifikasiRoutes` ke children RootLayout.
 */
import type { RouteObject } from 'react-router-dom';

export const notifikasiRoutes: RouteObject[] = [
  {
    path: '/notifikasi',
    lazy: async () => ({ Component: (await import('./NotifInbox.js')).default }),
  },
];
