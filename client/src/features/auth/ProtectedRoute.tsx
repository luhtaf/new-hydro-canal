/**
 * ProtectedRoute — gerbang route ber-auth + role-gating.
 *
 * Urutan cek (penting):
 *   1. App-lock terkunci → AppLockScreen (gembok buka-app, sebelum apa pun).
 *   2. Belum ada akun aktif → redirect `/login` (simpan `from` untuk balik).
 *   3. `requireRole === 'admin'` tapi role efektif operator → NoAccess (port demo
 *      view "no-access": halaman khusus Admin/Manager).
 *
 * Ref: PLAN-FE.md router `<ProtectedRoute>` + per-route `requireRole`.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth, useRole } from './hooks.js';
import { useLockStore } from './lock.js';
import { AppLockScreen } from './AppLockScreen.js';
import type { Role } from '../../shared/types.js';

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: Role;
}) {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { role, isAdmin } = useRole();
  const locked = useLockStore((s) => s.locked);

  // 1. Gembok app — di atas segalanya.
  if (locked) return <AppLockScreen />;

  // 2. Auth gate.
  if (!isLoggedIn) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  // 3. Role gate.
  if (requireRole === 'admin' && !isAdmin) {
    return <NoAccess role={role} />;
  }

  return <>{children}</>;
}

/** Port demo view "no-access" — halaman khusus Admin/Manager. */
function NoAccess({ role }: { role: Role | null }) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4 text-center">
      <div className="max-w-md">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Akses dibatasi</h1>
        <p className="text-sm text-slate-600 mt-2">
          Halaman ini hanya untuk role <b>Admin / Manager</b>. Kamu sedang masuk
          sebagai <b>{role === 'operator' ? 'Operator' : role ?? '—'}</b>.
        </p>
      </div>
    </div>
  );
}
