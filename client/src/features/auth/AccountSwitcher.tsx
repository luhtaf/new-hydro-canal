/**
 * AccountSwitcher — multi-akun ala Gmail (spec § C).
 *
 * Dropdown di topnav: akun aktif di atas + indikator sync per-akun, daftar akun
 * lain (klik = switch), "Tambah akun lain" (→ /login addMode), "Keluar dari akun".
 *
 * Aturan switch offline (spec § C): hanya akun `enrolled` (pernah login online di
 * device ini) yang boleh di-switch saat OFFLINE. Akun `revoked` ditandai & tak bisa
 * dipakai. Tiap akun = PouchDB namespace sendiri → switch = ganti namespace aktif
 * (sync engine yang re-attach DB; di sini cukup set activeUserId).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown,
  LogOut,
  Plus,
  UserCircle2,
  WifiOff,
  Ban,
} from 'lucide-react';
import { useAuthStore, selectActiveAccount, selectAccounts, type Account } from './store.js';
import { authApi } from './api.js';
import { SyncBadge } from './SyncBadge.js';

export function AccountSwitcher() {
  const navigate = useNavigate();
  const active = useAuthStore(selectActiveAccount);
  const accounts = useAuthStore(selectAccounts);
  const switchAccount = useAuthStore((s) => s.switchAccount);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  if (!active) return null;

  const others = accounts.filter((a) => a.userId !== active.userId);
  const online = navigator.onLine;

  function handleSwitch(acc: Account) {
    // Switch offline hanya untuk akun ter-enroll (spec § C).
    if (!online && !acc.enrolled) return;
    if (acc.revoked) return;
    switchAccount(acc.userId);
    setOpen(false);
    navigate('/', { replace: true });
  }

  async function handleLogout() {
    setOpen(false);
    await authApi.logout(); // best-effort server-side
    logout(); // logout eksplisit lokal (spec § C)
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 transition"
        title="Akun"
      >
        <Avatar initials={active.initials} />
        <SyncBadge sync={active.sync} compact />
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 mt-2 w-72 z-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Akun aktif */}
            <div className="p-4 border-b border-slate-100 flex items-start gap-3">
              <Avatar initials={active.initials} large />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{active.name}</div>
                <div className="text-xs text-slate-500 truncate">{active.email}</div>
                <div className="mt-2">
                  <SyncBadge sync={active.sync} />
                </div>
              </div>
            </div>

            {/* Akun lain */}
            {others.length > 0 && (
              <div className="py-1 border-b border-slate-100 max-h-64 overflow-auto">
                {others.map((acc) => {
                  const blockedOffline = !online && !acc.enrolled;
                  const disabled = blockedOffline || acc.revoked;
                  return (
                    <button
                      key={acc.userId}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSwitch(acc)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Avatar initials={acc.initials} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{acc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {acc.email}
                        </div>
                      </div>
                      {acc.revoked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-600">
                          <Ban className="w-3 h-3" /> dicabut
                        </span>
                      ) : blockedOffline ? (
                        <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <SyncBadge sync={acc.sync} compact />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Aksi */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('/login', { state: { addMode: true } });
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                <span className="grid place-items-center w-7 h-7 rounded-full bg-slate-100 text-slate-500">
                  <Plus className="w-4 h-4" />
                </span>
                Tambah akun lain
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                <span className="grid place-items-center w-7 h-7 rounded-full bg-rose-100">
                  <LogOut className="w-4 h-4" />
                </span>
                Keluar dari akun ini
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ initials, large }: { initials: string; large?: boolean }) {
  if (!initials) return <UserCircle2 className="w-6 h-6 text-slate-400" />;
  return (
    <span
      className={`grid place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white font-semibold ${
        large ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-[11px]'
      }`}
    >
      {initials}
    </span>
  );
}
