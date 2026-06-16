/**
 * Hooks auth — facade ramah komponen di atas store.
 *
 * Komponen JANGAN baca store mentah; pakai hook ini supaya selector + memo
 * konsisten. Ref: PLAN-FE.md hooks/useAuth.ts + hooks/useRole.ts.
 */
import { useAuthStore, selectActiveAccount, selectAccounts, selectEffectiveRole, type Account } from './store.js';
import type { Role } from '../../shared/types.js';

/** Akun aktif + status login. */
export function useAuth(): {
  account: Account | null;
  isLoggedIn: boolean;
  accounts: Account[];
} {
  const account = useAuthStore(selectActiveAccount);
  const accounts = useAuthStore(selectAccounts);
  return { account, isLoggedIn: account !== null, accounts };
}

/**
 * Role efektif + helper gating. `isAdmin` ikut roleOverride (RoleSwitcher),
 * supaya nav links & permission menyesuaikan otomatis (sama seperti demo).
 */
export function useRole(): {
  role: Role | null;
  isAdmin: boolean;
  /** true kalau role efektif memenuhi `min` (admin > operator). */
  can: (min: Role) => boolean;
} {
  const role = useAuthStore(selectEffectiveRole);
  const isAdmin = role === 'admin';
  return {
    role,
    isAdmin,
    can: (min) => (min === 'admin' ? isAdmin : role !== null),
  };
}
