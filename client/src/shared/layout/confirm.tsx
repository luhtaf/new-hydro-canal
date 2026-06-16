/**
 * confirmDialog — modal konfirmasi kustom (BUKAN window.confirm).
 *
 * Demo ref: app.js `window.confirmDialog({ title, body, confirm, danger, onConfirm })`.
 * Dipakai untuk aksi destruktif (Reset lokal, Hapus operator, dll).
 *
 * API imperatif berbasis store kecil → bisa dipanggil dari mana saja:
 *   import { confirmDialog } from 'shared/layout/confirm';
 *   confirmDialog({ title, body, danger: true, onConfirm: () => ... });
 *
 * Backdrop blur + click-outside-to-close + ESC. Render <ConfirmHost/> sekali di shell.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { Icon } from './Icon.js';

export interface ConfirmOptions {
  title: string;
  body: string;
  confirm?: string;
  cancel?: string;
  danger?: boolean;
  onConfirm?: () => void;
}

interface ConfirmStore {
  current: ConfirmOptions | null;
  open: (o: ConfirmOptions) => void;
  close: () => void;
}

const useConfirm = create<ConfirmStore>((set) => ({
  current: null,
  open: (current) => set({ current }),
  close: () => set({ current: null }),
}));

/** API imperatif. */
export function confirmDialog(opts: ConfirmOptions) {
  useConfirm.getState().open(opts);
}

/** Host modal — pasang sekali di RootLayout. */
export function ConfirmHost() {
  const current = useConfirm((s) => s.current);
  const close = useConfirm((s) => s.close);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, close]);

  if (!current || typeof document === 'undefined') return null;

  const danger = current.danger ?? false;
  const onConfirm = () => {
    close();
    current.onConfirm?.();
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
    >
      <div className="modal-card">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${
                danger
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-brand-50 text-brand-600'
              }`}
            >
              <Icon name={danger ? 'alert-triangle' : 'info'} className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="font-bold text-lg text-slate-900">{current.title}</div>
              <div className="text-sm text-slate-600 mt-1.5">{current.body}</div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-slate-100 flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={close}>
            {current.cancel ?? 'Batal'}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {current.confirm ?? 'Lanjut'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
