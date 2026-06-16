/**
 * DistrikRow — 1 baris distrik di dalam card region. Port demo `view-distrik` row:
 * kode 4-char (mono badge brand) + nama distrik + menu aksi (edit / hapus).
 *
 * Slice-local. Menu pakai dropdown ringan (klik-luar tutup) — bukan lib eksternal,
 * pola sama dengan UserRow [users].
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import type { Distrik } from '../api.js';

interface Props {
  distrik: Distrik;
  onEdit: () => void;
  onDelete: () => void;
}

export function DistrikRow({ distrik: d, onEdit, onDelete }: Props) {
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

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/40">
      <span className="rounded bg-brand-50 px-2 py-0.5 font-mono text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
        {d.kode}
      </span>
      <span className="truncate text-sm">{d.name}</span>

      <div className="relative ml-auto" ref={menuRef}>
        <button
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Aksi distrik"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Icon name="more-horizontal" className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="shadow-pop absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <MenuItem
              icon="settings"
              label="Edit distrik"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
            />
            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
            <MenuItem
              icon="trash-2"
              label="Hapus"
              danger
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: 'settings' | 'trash-2';
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
