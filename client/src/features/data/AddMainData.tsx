/**
 * AddMainData (`/admin/maindata/add`) — port `AddMainData.js`.
 * Form minimal buat Data root (batang_canal_id). Validasi react-hook-form + zod.
 */
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { useCreateMainData } from './hooks.js';

const schema = z.object({
  batang_canal_id: z
    .string()
    .trim()
    .min(1, 'Wajib diisi')
    .max(64, 'Maks 64 karakter'),
});
type FormValues = z.infer<typeof schema>;

export function AddMainData() {
  const nav = useNavigate();
  const create = useCreateMainData();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { batang_canal_id: '' } });

  const onSubmit = handleSubmit((raw) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? 'Form tidak valid', 'err');
      return;
    }
    create.mutate(
      { batang_canal_id: parsed.data.batang_canal_id, canal_data: [] },
      {
        onSuccess: (d) => {
          toast('Main data dibuat', 'ok');
          nav(`/admin/data/${d._id}`);
        },
        onError: () => toast('Gagal membuat main data', 'err'),
      },
    );
  });

  return (
    <PageShell title="Tambah Main Data" subtitle="Buat batang canal baru.">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-card p-6 max-w-lg space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Batang Canal ID
          </label>
          <input
            className="input font-mono"
            placeholder="mis. KBN01-K02"
            autoFocus
            {...register('batang_canal_id', { required: true })}
          />
          {errors.batang_canal_id && (
            <p className="mt-1 text-xs text-rose-600">
              {errors.batang_canal_id.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || create.isPending}
          >
            <Icon name="check" className="h-4 w-4" />
            Simpan
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => nav('/admin/maindata')}
          >
            Batal
          </button>
        </div>
      </form>
    </PageShell>
  );
}

export default AddMainData;
