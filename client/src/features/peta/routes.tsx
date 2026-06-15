/**
 * Route config slice `peta`. Satu route `/peta` (semua role — operator & admin
 * sama-sama lihat peta). Lazy import supaya Leaflet + proj4 + CARTO CSS hanya
 * masuk bundle saat halaman dibuka.
 *
 * Slice router meng-spread `petaRoutes` ke children RootLayout (lihat field wiring).
 */
import type { RouteObject } from 'react-router-dom';

export const petaRoutes: RouteObject[] = [
  {
    path: '/peta',
    lazy: async () => ({ Component: (await import('./PetaPage.js')).default }),
  },
];
