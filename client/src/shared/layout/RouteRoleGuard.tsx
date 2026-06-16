/**
 * RouteRoleGuard — gerbang role di level <Outlet> berbasis `handle.requireRole`.
 *
 * Slice fitur menandai route admin-only via `handle: { requireRole: 'admin' }`
 * (lihat data/undangan/users/audit/reports/lapangan routes). Guard ini membaca
 * route match terdalam lewat `useMatches()` dan menampilkan NoAccessPage saat role
 * efektif tidak cukup — jadi tiap slice cukup deklaratif, tanpa membungkus manual
 * <RequireAdmin> di router (DRY + tidak ada route admin yang lolos tanpa sengaja).
 *
 * Sumber role = role store (di-set [auth] dari session). Konsisten dgn RequireAdmin.
 */
import type { ReactNode } from 'react';
import { useMatches } from 'react-router-dom';
import { useRole } from '../stores/role.js';
import { NoAccessPage } from './NoAccessPage.js';

type RoleHandle = { requireRole?: 'admin' | 'operator' };

function isRoleHandle(h: unknown): h is RoleHandle {
  return typeof h === 'object' && h !== null && 'requireRole' in h;
}

export function RouteRoleGuard({ children }: { children: ReactNode }) {
  const role = useRole((s) => s.role);
  const matches = useMatches();

  // Ambil requireRole dari match terdalam yang mendeklarasikannya.
  let required: RoleHandle['requireRole'];
  for (const m of matches) {
    if (isRoleHandle(m.handle) && m.handle.requireRole) {
      required = m.handle.requireRole;
    }
  }

  if (required === 'admin' && role !== 'admin') return <NoAccessPage />;
  return <>{children}</>;
}
