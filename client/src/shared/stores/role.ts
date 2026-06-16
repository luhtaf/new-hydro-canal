/**
 * Role store — admin/operator (demo touch: role pill di top nav, swap on click).
 *
 * Demo ref: app.js `applyRole` / `setRole`. Role gating di-drive lewat class
 * `body.role-admin` / `body.role-operator` (globals.css ROLE HIERARCHY:
 * `body.role-operator [data-min-role="admin"] { display:none }`).
 *
 * Di produksi role berasal dari `useAuth().user.role`; di shell ini di-toggle
 * lokal supaya demo touch "klik untuk ganti role" tetap hadir. Persist `role`.
 */
import { create } from 'zustand';
import type { Role } from '../types.js';

const STORAGE_KEY = 'role';

/** Identitas operator demo (di produksi dari session user). */
export interface RoleIdentity {
  label: string;
  sub: string;
  initials: string;
}

const IDENTITY: Record<Role, RoleIdentity> = {
  admin: { label: 'Admin', sub: 'Manager · semua akses', initials: 'MG' },
  operator: { label: 'Operator', sub: 'KBN01 · Fathul', initials: 'FA' },
};

function readInitial(): Role {
  if (typeof window === 'undefined') return 'operator';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'admin' ? 'admin' : 'operator';
}

/** Sinkron class body untuk gating CSS `data-min-role`. */
function applyToDom(role: Role) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('role-admin', role === 'admin');
  document.body.classList.toggle('role-operator', role === 'operator');
}

interface RoleStore {
  role: Role;
  identity: RoleIdentity;
  set: (r: Role) => void;
  toggle: () => void;
}

export const useRole = create<RoleStore>((set, get) => ({
  role: readInitial(),
  identity: IDENTITY[readInitial()],
  set: (role) => {
    if (get().role === role) return;
    window.localStorage.setItem(STORAGE_KEY, role);
    applyToDom(role);
    set({ role, identity: IDENTITY[role] });
  },
  toggle: () => get().set(get().role === 'admin' ? 'operator' : 'admin'),
}));

/** Panggil sekali saat boot. */
export function initRole() {
  applyToDom(useRole.getState().role);
}
