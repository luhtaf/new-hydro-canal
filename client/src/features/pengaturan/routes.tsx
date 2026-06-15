/**
 * Route config slice `pengaturan` (PLAN-FE page Pengaturan).
 *
 * `pengaturan` TANPA role gating di level route: operator boleh buka untuk lihat
 * Akun + Penyimpanan lokal. Section Threshold yang admin-only (gating internal di
 * ThresholdSection via useRole) — bukan seluruh halaman. Lazy import + Suspense
 * (PLAN-FE: lazy routes) supaya bundle kecil.
 *
 * Path RELATIF (tanpa leading slash) agar konsisten dgn children RootLayout di
 * `router.tsx` (mis. `kalender`, `penugasan`). Slice router meng-spread
 * `pengaturanRoutes` ke children RootLayout, mengganti placeholder `pengaturan`.
 */
import type { RouteObject } from 'react-router-dom';

export const pengaturanRoutes: RouteObject[] = [
  {
    path: 'pengaturan',
    lazy: async () => ({ Component: (await import('./PengaturanPage.js')).default }),
  },
];
