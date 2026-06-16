/**
 * TopNav — bar atas sticky shell (demo touch lengkap).
 *
 * Demo ref: index.html <nav id="topnav">. Isi (kiri→kanan):
 * - mobile menu toggle + logo droplets + nama + version chip "v2.0 · ops"
 * - ⌘K button (label "Cari" + kbd badge)
 * - online/offline toggle (offline simulator)
 * - dark-mode toggle (sun/moon, persist)
 * - sync drawer button + queue badge merah
 * - live clock (HH:MM:SS + hari/tanggal)
 * - tour button
 * - role pill (admin amber / operator blue, klik → swap)
 */
import { Link } from 'react-router-dom';
import { useTheme } from '../stores/theme.js';
import { useRole } from '../stores/role.js';
import { useUi } from '../stores/ui.js';
import { useClock } from '../hooks/useClock.js';
import { startTour } from './tour-store.js';
import { Icon } from './Icon.js';

export function TopNav() {
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const role = useRole((s) => s.role);
  const identity = useRole((s) => s.identity);
  const toggleRole = useRole((s) => s.toggle);

  const online = useUi((s) => s.online);
  const toggleOnline = useUi((s) => s.toggleOnline);
  const openCmdk = useUi((s) => s.openCmdk);
  const openSyncDrawer = useUi((s) => s.openSyncDrawer);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const queueLen = useUi((s) => s.queue.length);
  const toast = useUi((s) => s.toast);

  const clock = useClock();

  const onToggleRole = () => {
    toggleRole();
    const next = role === 'admin' ? 'Operator' : 'Admin';
    toast(`Role diganti → ${next}`, 'ok');
  };

  return (
    <nav
      id="topnav"
      className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 no-print"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100"
          onClick={toggleSidebar}
          aria-label="Buka menu"
        >
          <Icon name="menu" className="w-5 h-5 text-slate-600" />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2.5 font-display font-bold tracking-tight text-slate-900"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-soft ring-1 ring-inset ring-white/20">
            <Icon name="droplets" className="w-4 h-4 text-white" />
          </span>
          <span className="hidden sm:inline">HydroCanal QC</span>
        </Link>
        <span className="hidden md:inline-flex badge bg-slate-100 text-slate-500 ml-2 font-mono">
          v2.0 · ops
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* ⌘K */}
          <button
            className="btn btn-ghost text-xs hidden sm:inline-flex"
            title="Cari (⌘K)"
            onClick={openCmdk}
          >
            <Icon name="search" className="w-3.5 h-3.5" />
            <span>Cari</span>
            <span className="cmdk-kbd ml-1">⌘K</span>
          </button>

          {/* online/offline */}
          <button
            className="btn btn-ghost text-xs"
            title="Toggle koneksi (simulator)"
            onClick={toggleOnline}
          >
            <Icon name={online ? 'wifi' : 'wifi-off'} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
          </button>

          {/* dark mode */}
          <button
            className="btn btn-ghost text-xs"
            title="Toggle tema"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-3.5 h-3.5" />
          </button>

          {/* sync drawer + queue badge */}
          <button
            className="relative btn btn-ghost text-xs"
            onClick={openSyncDrawer}
            title="Antrian sinkronisasi"
          >
            <Icon name="refresh-cw" className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sinkron</span>
            {queueLen > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">
                {queueLen}
              </span>
            )}
          </button>

          {/* live clock */}
          <div className="hidden lg:flex flex-col items-end leading-tight pr-2 text-xs">
            <span className="font-mono font-semibold text-slate-900">{clock.time}</span>
            <span className="text-slate-500 text-[10px]">{clock.date}</span>
          </div>

          {/* tour */}
          <button
            className="btn btn-ghost text-xs hidden md:inline-flex"
            title="Walkthrough"
            onClick={() => startTour()}
          >
            <Icon name="presentation" className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Tour</span>
          </button>

          {/* role pill */}
          <div
            id="role-switcher"
            className={`role-pill ${role} hidden md:inline-flex ml-1`}
            title="Klik untuk ganti role"
            role="button"
            tabIndex={0}
            onClick={onToggleRole}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleRole();
              }
            }}
          >
            <span className="role-icon">
              <Icon name={role === 'admin' ? 'shield-check' : 'user'} className="w-3 h-3" />
            </span>
            <div className="flex flex-col items-start leading-tight">
              <span>{identity.label}</span>
              <span className="text-[10px] font-normal opacity-70">{identity.sub}</span>
            </div>
            <Icon name="chevrons-up-down" className="w-3 h-3 opacity-60" />
          </div>
        </div>
      </div>
    </nav>
  );
}
