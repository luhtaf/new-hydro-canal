/**
 * nav-config — sumber kebenaran tunggal navigasi shell.
 *
 * Dipakai oleh Sidebar (grup uppercase), BottomTabNav (mobile), dan
 * CommandPalette (route items). Satu daftar → tidak ada duplikasi drift antar
 * komponen shell. Demo ref: index.html <aside id="sidebar"> + bottom nav + CMD_ITEMS.
 *
 * Icon = nama lucide-react (di-resolve lewat lib/icon.ts barrel dinamis).
 * `minRole: 'admin'` → item disembunyikan saat operator (gating CSS data-min-role
 * juga aktif, ini gating di level data supaya tidak render sama sekali).
 */
import type { Role } from '../types.js';
import type { IconName } from '../lib/icon.js';

export interface NavItem {
  label: string;
  to: string;
  icon: IconName;
  minRole?: Role;
  /** indent (sub-item, mis. "Undangan baru" di bawah Undangan). */
  indent?: boolean;
  /** badge counter statis (mis. konflik sync). Di produksi: derive dari data. */
  badge?: { count: number; color: 'rose' | 'brand' };
}

export interface NavGroup {
  /** label uppercase (WORKSPACE / LAPANGAN / QC / MANAJEMEN). */
  title: string;
  minRole?: Role;
  items: NavItem[];
}

/** Grup sidebar — urutan & label persis demo. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', to: '/', icon: 'layout-dashboard' },
      { label: 'Kalender', to: '/kalender', icon: 'calendar-days' },
      { label: 'Undangan QC', to: '/undangan', icon: 'mail' },
      { label: 'Undangan baru', to: '/undangan/baru', icon: 'plus-circle', minRole: 'admin', indent: true },
      { label: 'Penugasan Saya', to: '/penugasan', icon: 'clipboard-list' },
      { label: 'Notifikasi', to: '/notifikasi', icon: 'bell' },
    ],
  },
  {
    title: 'Lapangan',
    items: [
      { label: 'Input Parameter', to: '/lapangan/parameter', icon: 'form-input' },
      { label: 'Input Kedalaman', to: '/lapangan/kedalaman', icon: 'ruler' },
      { label: 'Peta penugasan', to: '/peta', icon: 'map' },
    ],
  },
  {
    title: 'QC',
    items: [
      { label: 'QC Processing', to: '/qc', icon: 'line-chart' },
      { label: 'Konflik sync', to: '/konflik', icon: 'git-merge', badge: { count: 2, color: 'rose' } },
      { label: 'Distrik & Region', to: '/distrik', icon: 'map-pinned', minRole: 'admin' },
      { label: 'Pengaturan', to: '/pengaturan', icon: 'settings' },
      { label: 'Bantuan', to: '/help', icon: 'circle-help' },
    ],
  },
  {
    title: 'Manajemen',
    minRole: 'admin',
    items: [
      { label: 'Operator & akun', to: '/users', icon: 'users', minRole: 'admin' },
      { label: 'Reports', to: '/reports', icon: 'bar-chart-3', minRole: 'admin' },
      { label: 'Audit log', to: '/audit', icon: 'scroll-text', minRole: 'admin' },
    ],
  },
];

/** Bottom tab nav mobile — 5 ikon (demo: Home/Kalender/Tugas/Peta/Akun). */
export const BOTTOM_TABS: NavItem[] = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'Kalender', to: '/kalender', icon: 'calendar' },
  { label: 'Tugas', to: '/penugasan', icon: 'clipboard-list' },
  { label: 'Peta', to: '/peta', icon: 'map' },
  { label: 'Akun', to: '/pengaturan', icon: 'user' },
];

/** Filter helper: buang item/grup di atas role saat ini. */
export function visibleGroups(role: Role): NavGroup[] {
  const allow = (min?: Role) => min !== 'admin' || role === 'admin';
  return NAV_GROUPS.filter((g) => allow(g.minRole)).map((g) => ({
    ...g,
    items: g.items.filter((i) => allow(i.minRole)),
  }));
}
