/**
 * UserRow — 1 baris tabel operator. Port demo `renderUsers` row: avatar gradient
 * inisial, role badge, USV mono, status dot, produktivitas bar, terakhir aktif,
 * + menu aksi (edit / reset PIN / nonaktifkan).
 *
 * Slice-local. Menu pakai dropdown ringan (klik-luar tutup) — bukan lib eksternal.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import type { ManagedUser } from '../api.js';

interface Props {
  user: ManagedUser;
  onEdit: () => void;
  onResetPin: () => void;
  onDelete: () => void;
}

/** Waktu relatif singkat dari ISO (mis. "2 menit lalu"). */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'kemarin';
  return `${d} hari lalu`;
}

export function UserRow({ user: u, onEdit, onResetPin, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const isAdmin = u.role === 'admin';
  const prod = u.productivityCache;

  // Tailwind JIT tak bisa baca string dinamis → kelas statik per-kondisi.
  const roleBadge = isAdmin ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700';
  const isAktif = u.status === 'aktif';
  const stBadge = isAktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600';
  const stDot = isAktif ? 'bg-emerald-500' : 'bg-slate-400';

  return (
    <tr className="table-row">
      {/* User */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${
              isAdmin ? 'from-amber-500 to-amber-700' : 'from-brand-500 to-brand-700'
            }`}
          >
            {u.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{u.name}</div>
            <div className="truncate text-xs text-slate-500">{u.email}</div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span className={`badge ${roleBadge}`}>
          <Icon name={isAdmin ? 'shield-check' : 'user'} className="h-3 w-3" />
          {u.role}
        </span>
      </td>

      {/* USV */}
      <td className="px-4 py-3 font-mono text-xs">
        {u.usv ?? <span className="text-slate-300">—</span>}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`badge ${stBadge}`}>
          <span className={`badge-dot ${stDot}`} />
          {u.status}
        </span>
      </td>

      {/* Produktivitas */}
      <td className="px-4 py-3">
        {prod && prod.kanal30d > 0 ? (
          <div className="flex items-center gap-2">
            <div className="font-semibold tabular-nums">{prod.kanal30d}</div>
            <div className="h-1.5 max-w-[100px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-full bg-emerald-500" style={{ width: `${prod.passRate}%` }} />
            </div>
            <div className="text-xs font-semibold text-emerald-700 tabular-nums">
              {prod.passRate}%
            </div>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* Terakhir aktif */}
      <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(u.lastActiveAt)}</td>

      {/* Aksi */}
      <td className="px-4 py-3">
        <div className="relative" ref={menuRef}>
          <button
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Aksi"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Icon name="more-horizontal" className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="shadow-pop absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <MenuItem icon="settings" label="Edit akun" onClick={() => { setMenuOpen(false); onEdit(); }} />
              <MenuItem icon="refresh-cw" label="Reset PIN" onClick={() => { setMenuOpen(false); onResetPin(); }} />
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              <MenuItem icon="trash-2" label="Nonaktifkan" danger onClick={() => { setMenuOpen(false); onDelete(); }} />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: 'settings' | 'refresh-cw' | 'trash-2';
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left font-medium transition ${
        danger
          ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}
