/**
 * RoleSwitcher — pill role di topnav (port demo `#role-switcher`).
 *
 * Klik → toggle Admin ↔ Operator (roleOverride sesi). Nav links & permission
 * menyesuaikan otomatis lewat `useRole` (sama perilaku demo, lihat tour step
 * "Role hierarchy"). Override sesi-only (tidak dipersist).
 *
 * Catatan: ini override TAMPILAN/permission lokal, bukan eskalasi privilege server
 * — endpoint tetap divalidasi oleh be-auth middleware. Operator yang bukan admin
 * di server tidak akan dapat data admin walau pill menunjukkan "Admin".
 * Visual class `role-pill admin|operator` dari globals.css (port style.css).
 */
import { User, ChevronsUpDown } from 'lucide-react';
import { useAuthStore, selectActiveAccount, selectEffectiveRole } from './store.js';

export function RoleSwitcher() {
  const account = useAuthStore(selectActiveAccount);
  const role = useAuthStore(selectEffectiveRole);
  const setRoleOverride = useAuthStore((s) => s.setRoleOverride);

  if (!account) return null;

  const isAdmin = role === 'admin';
  const sub = account.usv
    ? `${account.usv} · ${account.name.split(' ')[0]}`
    : account.name.split(' ')[0];

  function toggle() {
    setRoleOverride(isAdmin ? 'operator' : 'admin');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`role-pill ${isAdmin ? 'admin' : 'operator'} hidden md:inline-flex ml-1`}
      title="Klik untuk ganti role"
    >
      <span className="role-icon">
        <User className="w-3 h-3" />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span>{isAdmin ? 'Admin' : 'Operator'}</span>
        <span className="text-[10px] font-normal opacity-70">{sub}</span>
      </span>
      <ChevronsUpDown className="w-3 h-3 opacity-60" />
    </button>
  );
}
