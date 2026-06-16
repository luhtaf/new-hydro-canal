/**
 * EditMainData (`/admin/maindata/:id/edit`) — port `EditMainData.js`.
 * Edit field root (batang_canal_id) dari Data. Prefill dari query.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, ErrorState } from './components/states.js';
import { useMainData, useUpdateMainData } from './hooks.js';

interface FormValues {
  batang_canal_id: string;
}

export function EditMainData() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useMainData(id);
  const update = useUpdateMainData(id);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (data) reset({ batang_canal_id: data.batang_canal_id });
  }, [data, reset]);

  if (isLoading) {
    return (
      <PageShell title="Edit Main Data">
        <TableSkeleton rows={2} cols={1} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Edit Main Data">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const onSubmit = handleSubmit((values) => {
    const v = values.batang_canal_id.trim();
    if (!v) {
      toast('Batang Canal ID wajib diisi', 'err');
      return;
    }
    update.mutate(
      { batang_canal_id: v },
      {
        onSuccess: () => {
          toast('Perubahan disimpan', 'ok');
          nav('/admin/maindata');
        },
        onError: () => toast('Gagal menyimpan', 'err'),
      },
    );
  });

  return (
    <PageShell
      title="Edit Main Data"
      subtitle={
        <span className="font-mono text-slate-400">{data.batang_canal_id}</span>
      }
    >
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-card p-6 max-w-lg space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Batang Canal ID
          </label>
          <input className="input font-mono" {...register('batang_canal_id')} />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={update.isPending}
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

export default EditMainData;
