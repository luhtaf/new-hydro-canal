/**
 * CommandPalette (⌘K) — fuzzy search route + actions, keyboard nav, React Portal.
 *
 * Demo ref: app.js CMD_ITEMS + openCmdK/renderCmdK/filterCmdK. ESC tutup, ↑↓ navigasi,
 * ↵ pilih, hover juga update active. Item route → navigate; item action → jalankan
 * (toggle role/theme/conn, force sync, tour, print, trigger konflik).
 *
 * Render ke #cmdk-root (Portal). Daftar route diambil dari nav-config supaya satu
 * sumber; ditambah actions shell.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../stores/ui.js';
import { useTheme } from '../stores/theme.js';
import { useRole } from '../stores/role.js';
import { startTour } from './tour-store.js';
import { NAV_GROUPS } from './nav-config.js';
import { Icon } from './Icon.js';
import type { IconName } from '../lib/icon.js';

interface CmdItem {
  id: string;
  label: string;
  icon: IconName;
  /** route untuk navigate. */
  go?: string;
  /** aksi non-navigasi. */
  action?: () => void;
}

/** Bangun daftar perintah: route dari nav-config + actions shell. */
function useCommands(): CmdItem[] {
  const navigate = useNavigate();
  const toggleTheme = useTheme((s) => s.toggle);
  const toggleRole = useRole((s) => s.toggle);
  const toggleOnline = useUi((s) => s.toggleOnline);
  const openSyncDrawer = useUi((s) => s.openSyncDrawer);
  const clearQueue = useUi((s) => s.clearQueue);
  const toast = useUi((s) => s.toast);

  return useMemo(() => {
    const routes: CmdItem[] = NAV_GROUPS.flatMap((g) =>
      g.items.map((it) => ({ id: 'r:' + it.to, label: it.label, icon: it.icon, go: it.to })),
    );
    const actions: CmdItem[] = [
      { id: 'a:role', label: 'Ganti role (admin/operator)', icon: 'shield-check', action: toggleRole },
      { id: 'a:tour', label: 'Mulai walkthrough tour', icon: 'presentation', action: startTour },
      { id: 'a:konflik', label: 'Trigger konflik sync (demo)', icon: 'zap', action: () => navigate('/konflik') },
      { id: 'a:theme', label: 'Toggle dark mode', icon: 'sun-moon', action: toggleTheme },
      { id: 'a:conn', label: 'Toggle offline/online', icon: 'wifi-off', action: toggleOnline },
      {
        id: 'a:sync',
        label: 'Sinkron sekarang',
        icon: 'refresh-cw',
        action: () => {
          clearQueue();
          openSyncDrawer();
          toast('Sinkronisasi dijalankan.', 'ok');
        },
      },
      { id: 'a:print', label: 'Cetak halaman aktif', icon: 'printer', action: () => window.print() },
    ];
    return [...routes, ...actions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function CommandPalette() {
  const open = useUi((s) => s.cmdkOpen);
  const close = useUi((s) => s.closeCmdk);
  const navigate = useNavigate();
  const commands = useCommands();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [query, commands]);

  // Reset saat dibuka.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Clamp active saat hasil berubah.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const exec = (item?: CmdItem) => {
    if (!item) return;
    close();
    if (item.go) navigate(item.go);
    else item.action?.();
  };

  // Keyboard navigasi (↑↓↵) — hanya saat palette terbuka.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        exec(filtered[active]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, filtered, active]);

  // Scroll item aktif ke view.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="cmdk"
      className="fixed inset-0 z-50 grid place-items-start pt-[15vh] px-4 no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-pop border border-slate-200 overflow-hidden animate-scale-in">
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <Icon name="search" className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-900"
            placeholder="Ketik perintah atau halaman…"
            autoComplete="off"
          />
          <span className="cmdk-kbd">ESC</span>
        </div>

        <div ref={listRef} className="p-2 max-h-[50vh] overflow-y-auto" id="cmdk-list">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">Tidak ada hasil.</div>
          ) : (
            filtered.map((it, i) => (
              <div
                key={it.id}
                data-i={i}
                className={`cmdk-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => exec(it)}
              >
                <Icon name={it.icon} className="w-4 h-4" />
                <span className="flex-1">{it.label}</span>
                {it.go && <span className="cmdk-kbd">↵</span>}
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex gap-2">
            <span>
              <span className="cmdk-kbd">↑</span>
              <span className="cmdk-kbd">↓</span> navigasi
            </span>
            <span>
              <span className="cmdk-kbd">↵</span> pilih
            </span>
          </div>
          <div>HydroCanal QC</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
