import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './shared/layout/RootLayout.js';
import { NotFoundPage } from './shared/layout/NotFoundPage.js';
import { LoginPage, ProtectedRoute } from './features/auth/index.js';
import { dataRoutes } from './features/data/index.js';
import { KonflikList } from './features/konflik/KonflikList.js';

// --- Phase 2 ops layer: route config per slice (absolute paths + handle.requireRole) ---
import { undanganRoutes } from './features/undangan/index.js';
import { penugasanRoutes } from './features/penugasan/index.js';
import { lapanganParameterRoutes } from './features/lapangan-parameter/index.js';
import { lapanganKedalamanRoutes } from './features/lapangan-kedalaman/index.js';
import { petaRoutes } from './features/peta/index.js';
import { kalenderRoutes } from './features/kalender/index.js';
import { notifikasiRoutes } from './features/notifikasi/index.js';
import { pengaturanRoutes } from './features/pengaturan/index.js';
import { usersRoutes } from './features/users/index.js';
import { auditRoutes } from './features/audit/index.js';
import { helpRoutes } from './features/help/index.js';
import { distrikRoutes } from './features/distrik/index.js';

/**
 * Router shell.
 *
 * RootLayout (TopNav/Sidebar/overlay) membungkus semua route lewat <Outlet>.
 * Route fitur Phase 2 dipasang lewat config slice masing-masing (spread route array
 * ATAU lazy default export). Gating admin lewat `handle.requireRole: 'admin'` yang
 * dibaca <RouteRoleGuard> di RootLayout (operator → NoAccessPage). Semua route admin
 * (users/audit/distrik/reports) kini punya slice/handle sendiri — tak ada placeholder lagi.
 *
 * Catatan: pakai createBrowserRouter (history API), bukan hash. Demo memang hash,
 * tapi produksi pakai path bersih (Pages SPA fallback). Selector tour disesuaikan.
 */

export const router = createBrowserRouter([
  // Login chromeless (di luar RootLayout: tanpa nav/sidebar). Spec § C: enroll/add account.
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard (index '/') — semua role.
      {
        index: true,
        lazy: async () => ({
          Component: (await import('./features/dashboard/index.js')).DashboardPage,
        }),
      },

      // Ops layer Phase 2 (spread route config slice — absolute paths).
      ...kalenderRoutes,
      ...undanganRoutes,
      ...penugasanRoutes,
      ...lapanganParameterRoutes,
      ...lapanganKedalamanRoutes,
      ...petaRoutes,
      ...notifikasiRoutes,
      ...pengaturanRoutes,
      ...helpRoutes,

      // QC Processing — lazy default export (slice tak ekspor route array).
      {
        path: 'qc',
        lazy: async () => ({
          Component: (await import('./features/qc/QcProcessing.js')).default,
        }),
      },

      // Konflik (Phase 1 slice).
      { path: 'konflik', element: <KonflikList /> },

      // --- Admin-only (gating via handle.requireRole di RouteRoleGuard) ---
      ...usersRoutes, // /users (handle.requireRole admin)
      ...auditRoutes, // /audit (handle.requireRole admin)
      ...distrikRoutes, // /distrik (handle.requireRole admin)
      {
        path: 'reports',
        handle: { requireRole: 'admin' },
        lazy: async () => ({
          Component: (await import('./features/reports/ReportsPage.js')).default,
        }),
      },

      // Port existing admin CRUD app lama (/admin/*). RouteObject[] lazy dari slice data.
      ...dataRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
