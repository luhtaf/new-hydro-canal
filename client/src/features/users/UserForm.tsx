/**
 * UserForm — modal tambah/edit operator (admin). Port demo aksi "Tambah operator"
 * (view-users) jadi form sungguhan: react-hook-form + zod, validasi inline.
 *
 * Mode:
 *   - tambah (user=null) → field PIN wajib + name/email/role/usv/status.
 *   - edit  (user=ManagedUser) → tanpa PIN (PIN di-reset lewat aksi terpisah).
 *     USV auto-disable saat role admin (USV ikut assignment, bukan identitas admin).
 *
 * Visual premium: modal-card (Portal), section rapi, field bertone error,
 * toggle role/status segmented control ala Linear. Lucide 1 weight.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { useCreateUser, useUpdateUser } from './hooks.js';
import type { ManagedUser } from './api.js';
import type { UsvCode } from '../../shared/types.js';

const USV_CODES: UsvCode[] = ['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05'];

const baseSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  role: z.enum(['admin', 'operator']),
  usv: z.enum(['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05']).or(z.literal('')),
  status: z.enum(['aktif', 'cuti']),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN harus 4–6 digit').or(z.literal('')),
});

type FormValues = z.infer<typeof baseSchema>;

interface Props {
  open: boolean;
  /** null = mode tambah, ManagedUser = mode edit. */
  user: ManagedUser | null;
  onClose: () => void;
}

export function UserForm({ open, user, onClose }: Props) {
  const isEdit = Boolean(user);
  const create = useCreateUser();
  const update = useUpdateUser();
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      // Tambah: PIN wajib. Edit: PIN tak dipakai (di-reset terpisah).
      isEdit
        ? baseSchema
        : baseSchema.refine((v) => /^\d{4,6}$/.test(v.pin), {
            path: ['pin'],
            message: 'PIN awal wajib (4–6 digit)',
          }),
    ),
    defaultValues: {
      name: '',
      email: '',
      role: 'operator',
      usv: 'KBN01',
      status: 'aktif',
      pin: '',
    },
  });

  const role = watch('role');

  // Sinkronkan form saat buka / ganti target.
  useEffect(() => {
    if (!open) return;
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        usv: user.usv ?? '',
        status: user.status,
        pin: '',
      });
    } else {
      reset({ name: '', email: '', role: 'operator', usv: 'KBN01', status: 'aktif', pin: '' });
    }
  }, [open, user, reset]);

  // Admin tak punya USV → kosongkan otomatis saat role pindah ke admin.
  useEffect(() => {
    if (role === 'admin') setValue('usv', '');
    else if (role === 'operator' && !watch('usv')) setValue('usv', 'KBN01');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!open || typeof document === 'undefined') return null;

  const onSubmit = handleSubmit((values) => {
    const usv = values.role === 'operator' ? (values.usv as UsvCode) : null;
    if (values.role === 'operator' && !usv) {
      toast('Operator wajib punya USV', 'err');
      return;
    }

    const onErr = (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal menyimpan akun';
      toast(msg, 'err');
    };

    if (isEdit && user) {
      update.mutate(
        {
          id: user.id,
          body: { name: values.name, email: values.email, role: values.role, usv, status: values.status },
        },
        {
          onSuccess: () => {
            toast(`Akun ${values.name} diperbarui`, 'ok');
            onClose();
          },
          onError: onErr,
        },
      );
    } else {
      create.mutate(
        {
          name: values.name,
          email: values.email,
          pin: values.pin,
          role: values.role,
          usv,
          status: values.status,
        },
        {
          onSuccess: () => {
            toast(`Operator ${values.name} dibuat`, 'ok');
            onClose();
          },
          onError: onErr,
        },
      );
    }
  });

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit operator' : 'Tambah operator'}
    >
      <div className="modal-card w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name={isEdit ? 'settings' : 'user-plus'} className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold">{isEdit ? 'Edit operator' : 'Tambah operator'}</div>
              <div className="text-xs text-slate-500">
                {isEdit ? user?.email : 'Akun baru langsung bisa login'}
              </div>
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

        {/* Body */}
        <form onSubmit={onSubmit} className="space-y-3.5 px-5 py-4">
          <Field label="Nama lengkap" error={errors.name?.message}>
            <input
              className="input"
              placeholder="mis. Sari Putri"
              autoFocus
              {...register('name')}
            />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input
              className="input"
              type="email"
              placeholder="nama@hydrocanal.id"
              {...register('email')}
            />
          </Field>

          {/* Role segmented */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <RolePick value="operator" current={role} onPick={(v) => setValue('role', v)} icon="user" />
              <RolePick value="admin" current={role} onPick={(v) => setValue('role', v)} icon="shield-check" />
            </div>
          </div>

          {/* USV + Status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="USV" error={errors.usv?.message}>
              <select
                className="input disabled:cursor-not-allowed disabled:opacity-50"
                disabled={role === 'admin'}
                {...register('usv')}
              >
                {role === 'admin' && <option value="">—</option>}
                {USV_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" {...register('status')}>
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
              </select>
            </Field>
          </div>

          {/* PIN — hanya saat tambah */}
          {!isEdit && (
            <Field label="PIN awal (4–6 digit)" error={errors.pin?.message}>
              <input
                className="input font-mono tracking-widest"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                {...register('pin')}
              />
            </Field>
          )}
          {isEdit && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-700/40">
              <Icon name="info" className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              PIN tidak diubah di sini. Pakai aksi “Reset PIN” di tabel.
            </p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending && <Icon name="refresh-cw" className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan perubahan' : 'Buat operator'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/** Field wrapper: label + control + pesan error tone rose. */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

/** Pilihan role ala segmented card (aksen brand saat aktif). */
function RolePick({
  value,
  current,
  onPick,
  icon,
}: {
  value: 'admin' | 'operator';
  current: string;
  onPick: (v: 'admin' | 'operator') => void;
  icon: 'user' | 'shield-check';
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize transition ${
        active
          ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-soft'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {value}
    </button>
  );
}
