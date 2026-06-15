/**
 * ResetPinDialog — modal kecil admin set PIN baru untuk 1 akun (POST
 * /users/:id/reset-pin). Beda dari change-pin [auth] yang butuh PIN lama; di sini
 * admin override. Reset PIN juga meng-aktifkan kembali akun yang ter-soft-delete.
 *
 * Slice-local. Validasi inline 4–6 digit. Modal via Portal.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../shared/layout/Icon.js';
import type { ManagedUser } from '../api.js';

interface Props {
  /** null = tertutup. */
  user: ManagedUser | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (user: ManagedUser, pin: string) => void;
}

export function ResetPinDialog({ user, pending, onClose, onSubmit }: Props) {
  const [pin, setPin] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (user) {
      setPin('');
      setTouched(false);
    }
  }, [user]);

  if (!user || typeof document === 'undefined') return null;

  const valid = /^\d{4,6}$/.test(pin);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit(user, pin);
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Reset PIN"
    >
      <div className="modal-card w-full max-w-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Icon name="refresh-cw" className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold">Reset PIN</div>
              <div className="text-xs text-slate-500">{user.name}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Tutup"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <Icon name="alert-triangle" className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
            Akun akan dipaksa login ulang dengan PIN baru ini.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              PIN baru (4–6 digit)
            </label>
            <input
              className="input font-mono tracking-widest"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onBlur={() => setTouched(true)}
            />
            {touched && !valid && (
              <p className="mt-1 text-xs font-medium text-rose-600">PIN harus 4–6 digit angka</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending || !valid}>
              {pending && <Icon name="refresh-cw" className="h-4 w-4 animate-spin" />}
              Reset PIN
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
