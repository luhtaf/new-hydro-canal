/**
 * ToastStack — pojok kanan bawah, slide-up, auto-dismiss 2800ms (di store).
 *
 * Demo ref: app.js `toast()`. Warna per-kind + ikon. Render via Portal supaya
 * selalu di atas layout & lolos dari overflow container.
 */
import { createPortal } from 'react-dom';
import { useUi } from '../stores/ui.js';
import { Icon } from './Icon.js';
import type { IconName } from '../lib/icon.js';

type ToastKind = 'ok' | 'warn' | 'err' | 'info';

const STYLE: Record<ToastKind, { bg: string; icon: IconName }> = {
  ok: { bg: 'bg-emerald-500', icon: 'check' },
  warn: { bg: 'bg-amber-500', icon: 'alert-triangle' },
  err: { bg: 'bg-rose-500', icon: 'x' },
  info: { bg: 'bg-slate-900', icon: 'info' },
};

export function ToastStack() {
  const toasts = useUi((s) => s.toasts);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      id="toast-stack"
      className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-sm"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const s = STYLE[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={`${s.bg} text-white px-4 py-2.5 rounded-lg shadow-pop flex items-center gap-2.5 text-sm font-medium animate-slide-up`}
          >
            <Icon name={s.icon} className="w-4 h-4 shrink-0" />
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
