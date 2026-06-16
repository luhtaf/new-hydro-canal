/**
 * Route config slice `penugasan` — untuk di-spread ke children RootLayout (pola `dataRoutes`).
 *
 * Wiring (router.tsx milik shell) tinggal mengganti dua placeholder `penugasan` &
 * `penugasan/:canalId` dengan spread `...penugasanRoutes`, atau lazy per-page:
 *   { path: 'penugasan', lazy: () => import('./features/penugasan/PenugasanList.js')
 *       .then(m => ({ Component: m.default })) }
 *
 * Lazy import (PLAN-FE: lazy routes + Suspense) supaya bundle Leaflet (di detail) tidak
 * ikut di chunk awal.
 */
import type { RouteObject } from 'react-router-dom';

export const penugasanRoutes: RouteObject[] = [
  {
    path: 'penugasan',
    lazy: async () => ({ Component: (await import('./PenugasanList.js')).default }),
  },
  {
    path: 'penugasan/:canalId',
    lazy: async () => ({ Component: (await import('./PenugasanDetail.js')).default }),
  },
];
