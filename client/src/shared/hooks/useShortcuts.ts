/**
 * useShortcuts — keyboard global shell.
 *
 * Demo ref: app.js keydown handler. ⌘K / Ctrl+K buka command palette,
 * ESC tutup overlay (palette + drawer). Navigasi ↑↓↵ di-handle di dalam
 * CommandPalette sendiri (butuh akses list terfilter), bukan di sini.
 */
import { useEffect } from 'react';
import { useUi } from '../stores/ui.js';

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUi.getState().toggleCmdk();
      } else if (e.key === 'Escape') {
        const ui = useUi.getState();
        if (ui.cmdkOpen) ui.closeCmdk();
        if (ui.syncDrawerOpen) ui.closeSyncDrawer();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
