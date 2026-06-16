/**
 * RequireAdmin — gerbang route admin-only. Operator → NoAccessPage.
 *
 * Catatan: di shell, role di-toggle lokal (role store). Di produksi role dari
 * session (useAuth). Gating UI (sidebar hide) sudah dilakukan via data-min-role,
 * ini lapisan kedua untuk akses URL langsung.
 */
import type { ReactNode } from 'react';
import { useRole } from '../stores/role.js';
import { NoAccessPage } from './NoAccessPage.js';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useRole((s) => s.role);
  if (role !== 'admin') return <NoAccessPage />;
  return <>{children}</>;
}
