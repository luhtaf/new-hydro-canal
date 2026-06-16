/**
 * DistrikForm — modal tambah/edit distrik (admin). Port demo aksi "Tambah distrik"
 * (view-distrik) jadi form sungguhan: react-hook-form + zod, validasi inline.
 *
 * Field: name (nama distrik), kode (4-char untuk filename QC), regionName (grouping),
 * contractorId (ObjectId opsional). Server menerima districtName/districtId via PUT/POST.
 *
 * Mode:
 *   - tambah (distrik=null) → semua field, name+kode wajib.
 *   - edit  (distrik=Distrik) → prefilled.
 *
 * Visual premium: modal-card (Portal), field bertone error, kode mono uppercase.
 * Lucide 1 weight.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { useCreateDistrict, useUpdateDistrict } from './hooks.js';
import type { Distrik, DistrikFormValues } from './api.js';

const schema = z.object({
  name: z.string().min(1, 'Nama distrik wajib diisi'),
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .regex(/^[A-Za-z0-9]{1,8}$/, 'Kode alfanumerik (mis. 3C01), maks 8 karakter'),
  regionName: z.string(),
  // ObjectId 24-hex atau kosong (= null di server).
  contractorId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'contractorId harus 24 karakter hex')
    .or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { name: '', kode: '', regionName: '', contractorId: '' };

interface Props {
  open: boolean;
  /** null = mode tambah, Distrik = mode edit. */
  distrik: Distrik | null;
  onClose: () => void;
}

export function DistrikForm({ open, distrik, onClose }: Props) {
  const isEdit = Boolean(distrik);
  const create = useCreateDistrict();
  const update = useUpdateDistrict();
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  // Sinkronkan form saat buka / ganti target.
  useEffect(() => {
    if (!open) return;
    if (distrik) {
      reset({
        name: distrik.name,
        kode: distrik.kode,
        regionName: distrik.regionName ?? '',
        contractorId: distrik.contractorId ?? '',
      });
    } else {
      reset(EMPTY);
    }
  }, [open, distrik, reset]);

  if (!open || typeof document === 'undefined') return null;

  const onSubmit = handleSubmit((values) => {
    const payload: DistrikFormValues = {
      name: values.name.trim(),
      kode: values.kode.trim().toUpperCase(),
      regionName: values.regionName.trim(),
      contractorId: values.contractorId.trim(),
    };

    const onErr = (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal menyimpan distrik';
      toast(msg, 'err');
    };

    if (isEdit && distrik) {
      update.mutate(
        { id: distrik.id, values: payload },
        {
          onSuccess: () => {
            toast(`Distrik ${payload.name} diperbarui`, 'ok');
            onClose();
          },
          onError: onErr,
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast(`Distrik ${payload.name} dibuat`, 'ok');
          onClose();
        },
        onError: onErr,
      });
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
      aria-label={isEdit ? 'Edit distrik' : 'Tambah distrik'}
    >
      <div className="modal-card w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name={isEdit ? 'settings' : 'map-pinned'} className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold">{isEdit ? 'Edit distrik' : 'Tambah distrik'}</div>
              <div className="text-xs text-slate-500">
                {isEdit ? distrik?.kode : 'Distrik baru langsung bisa di-assign'}
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
          <Field label="Nama distrik" error={errors.name?.message}>
            <input
              className="input"
              placeholder="mis. Banyuasin"
              autoFocus
              {...register('name')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kode (4-char)" error={errors.kode?.message}>
              <input
                className="input font-mono uppercase tracking-wider"
                placeholder="3C01"
                maxLength={8}
                {...register('kode')}
              />
            </Field>
            <Field label="Region" error={errors.regionName?.message}>
              <input
                className="input"
                placeholder="mis. PT. Ciptamas"
                {...register('regionName')}
              />
            </Field>
          </div>

          <Field label="Contractor ID (opsional)" error={errors.contractorId?.message}>
            <input
              className="input font-mono text-xs"
              placeholder="ObjectId 24-hex (kosongkan kalau belum ada)"
              {...register('contractorId')}
            />
          </Field>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-700/40">
            <Icon name="info" className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
            Kode jadi prefix output filename QC. Distrik dengan kode sama bisa muncul di
            region berbeda — selalu set region agar tidak konflik saat assign undangan.
          </p>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pending}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending && <Icon name="refresh-cw" className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan perubahan' : 'Tambah distrik'}
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
