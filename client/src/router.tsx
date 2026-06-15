import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './shared/layout/RootLayout.js';
import { RequireAdmin } from './shared/layout/RequireAdmin.js';
import { NotFoundPage } from './shared/layout/NotFoundPage.js';
import { makePlaceholder } from './shared/layout/Placeholder.js';
import type { IconName } from './shared/lib/icon.js';
import { LoginPage, ProtectedRoute } from './features/auth/index.js';
import { dataRoutes } from './features/data/index.js';
import { KonflikList } from './features/konflik/KonflikList.js';

/**
 * Router shell.
 *
 * RootLayout (TopNav/Sidebar/overlay) membungkus semua route lewat <Outlet>.
 * Tiap route fitur SEKARANG memakai Placeholder; slice fitur menggantinya dengan
 * komponen asli secara lazy, mis:
 *
 *   { path: 'penugasan', lazy: () => import('./features/penugasan/PenugasanPage.js')
 *       .then(m => ({ Component: m.PenugasanPage })) }
 *
 * Route admin-only dibungkus <RequireAdmin> (operator → NoAccessPage). Gating UI
 * (sidebar hide) sudah lewat data-min-role + visibleGroups; ini lapisan akses URL.
 *
 * Catatan: pakai createBrowserRouter (history API), bukan hash. Demo memang hash,
 * tapi produksi pakai path bersih (Pages SPA fallback). Selector tour disesuaikan.
 */

const ph = (title: string, icon: IconName, feature?: string) => ({
  Component: makePlaceholder(title, icon, feature),
});

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
      { index: true, ...ph('Dashboard', 'layout-dashboard', 'dashboard') },
      { path: 'kalender', ...ph('Kalender', 'calendar-days', 'kalender') },
      { path: 'undangan', ...ph('Undangan QC', 'mail', 'undangan') },
      {
        path: 'undangan/baru',
        element: (
          <RequireAdmin>
            <PlaceholderRoute title="Undangan baru" icon="plus-circle" feature="undangan" />
          </RequireAdmin>
        ),
      },
      { path: 'undangan/:orderNo', ...ph('Detail undangan', 'mail', 'undangan') },
      { path: 'penugasan', ...ph('Penugasan Saya', 'clipboard-list', 'penugasan') },
      { path: 'penugasan/:canalId', ...ph('Detail penugasan', 'clipboard-list', 'penugasan') },
      { path: 'lapangan/parameter', ...ph('Input Parameter', 'form-input', 'lapangan') },
      { path: 'lapangan/parameter/:canalId', ...ph('Input Parameter', 'form-input', 'lapangan') },
      { path: 'lapangan/kedalaman', ...ph('Input Kedalaman', 'ruler', 'lapangan') },
      { path: 'lapangan/kedalaman/:canalId', ...ph('Input Kedalaman', 'ruler', 'lapangan') },
      { path: 'qc', ...ph('QC Processing', 'line-chart', 'qc') },
      { path: 'peta', ...ph('Peta penugasan', 'map', 'peta') },
      { path: 'konflik', element: <KonflikList /> },
      { path: 'notifikasi', ...ph('Notifikasi', 'bell', 'notifikasi') },
      { path: 'pengaturan', ...ph('Pengaturan', 'settings', 'pengaturan') },
      { path: 'help', ...ph('Bantuan', 'circle-help', 'help') },
      {
        path: 'distrik',
        element: (
          <RequireAdmin>
            <PlaceholderRoute title="Distrik & Region" icon="map-pinned" feature="distrik" />
          </RequireAdmin>
        ),
      },
      {
        path: 'users',
        element: (
          <RequireAdmin>
            <PlaceholderRoute title="Operator & akun" icon="users" feature="users" />
          </RequireAdmin>
        ),
      },
      {
        path: 'reports',
        element: (
          <RequireAdmin>
            <PlaceholderRoute title="Reports & Analytics" icon="bar-chart-3" feature="reports" />
          </RequireAdmin>
        ),
      },
      {
        path: 'audit',
        element: (
          <RequireAdmin>
            <PlaceholderRoute title="Audit log" icon="scroll-text" feature="audit" />
          </RequireAdmin>
        ),
      },
      // Port existing admin CRUD app lama (/admin/*). RouteObject[] lazy dari slice data.
      ...dataRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

/** Wrapper komponen placeholder untuk dipakai inline di route admin. */
function PlaceholderRoute(props: { title: string; icon: IconName; feature?: string }) {
  const Cmp = makePlaceholder(props.title, props.icon, props.feature);
  return <Cmp />;
}
