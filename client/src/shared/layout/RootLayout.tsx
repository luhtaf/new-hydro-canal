/**
 * RootLayout — kerangka shell yang membungkus semua route ber-chrome.
 *
 * Komposisi (demo touch lengkap): OfflineBanner → TopNav → grid [Sidebar | <Outlet>]
 * → BottomTabNav (mobile). Overlay global: CommandPalette, SyncDrawer, TourOverlay,
 * ToastStack, ConfirmHost. Memasang keyboard shortcut (⌘K/ESC), online listener,
 * dan auto-trigger tour saat kunjungan pertama di dashboard.
 *
 * Route legacy "viewdata" (chart/data standalone) di-suppress chrome-nya supaya
 * bisa dibuka tanpa nav (sinkron dengan splash suppress). Outlet di-Suspense
 * dengan SplashScreen.
 */
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav.js';
import { Sidebar } from './Sidebar.js';
import { BottomTabNav } from './BottomTabNav.js';
import { OfflineBanner } from './OfflineBanner.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CommandPalette } from './CommandPalette.js';
import { SyncDrawer } from './SyncDrawer.js';
import { TourOverlay } from './TourOverlay.js';
import { ToastStack } from './ToastStack.js';
import { ConfirmHost } from './confirm.js';
import { SplashScreen, isSplashSuppressed } from './SplashScreen.js';
import { RouteRoleGuard } from './RouteRoleGuard.js';
import { useShortcuts } from '../hooks/useShortcuts.js';
import { useOnlineSync } from '../hooks/useOnline.js';
import { useTour, tourNeverSeen } from './tour-store.js';

function isChromeless(pathname: string): boolean {
  return isSplashSuppressed(pathname);
}

export function RootLayout() {
  const { pathname } = useLocation();
  const startTour = useTour((s) => s.start);
  useShortcuts();
  useOnlineSync();

  // Auto-trigger tour pada kunjungan pertama (hanya di dashboard).
  useEffect(() => {
    if (tourNeverSeen() && pathname === '/') {
      const t = setTimeout(() => startTour(), 600);
      return () => clearTimeout(t);
    }
  }, []); // sekali saja saat mount

  // Render legacy viewer tanpa chrome.
  if (isChromeless(pathname)) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <RouteRoleGuard>
          <Outlet />
        </RouteRoleGuard>
      </Suspense>
    );
  }

  return (
    <>
      <OfflineBanner />
      <TopNav />

      <div
        className="max-w-7xl mx-auto px-4 py-6 grid md:grid-cols-[220px_1fr] gap-6"
        id="layout"
      >
        <Sidebar />
        <main id="view" className="min-w-0 animate-fade" key={pathname}>
          <Breadcrumb />
          <Suspense fallback={<SplashScreen />}>
            <RouteRoleGuard>
              <Outlet />
            </RouteRoleGuard>
          </Suspense>
        </main>
      </div>

      <BottomTabNav />

      {/* Overlay global */}
      <CommandPalette />
      <SyncDrawer />
      <TourOverlay />
      <ToastStack />
      <ConfirmHost />
    </>
  );
}
