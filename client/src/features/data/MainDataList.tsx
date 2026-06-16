/**
 * MainDataList (`/admin/maindata`) — port `MainData.js` existing.
 * Daftar Data root (batang_canal_id). Admin entrypoint CRUD raw.
 * Touches demo: skeleton, empty state, hover lift, confirm dialog destruktif.
 */
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { confirmDialog } from '../../shared/layout/confirm.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, EmptyState, ErrorState } from './components/states.js';
import { useMainDataList, useDeleteMainData } from './hooks.js';

export function MainDataList() {
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useMainDataList();
  const del = useDeleteMainData();

  const onDelete = (id: string, label: string) => {
    confirmDialog({
      title: 'Hapus MainData?',
      body: `Data "${label}" beserta seluruh segmen & titik kedalaman akan dihapus permanen.`,
      confirm: 'Hapus',
      danger: true,
      onConfirm: () =>
        del.mutate(id, {
          onSuccess: () => toast('MainData dihapus', 'ok'),
          onError: () => toast('Gagal menghapus', 'err'),
        }),
    });
  };

  return (
    <PageShell
      title="Main Data"
      subtitle="Data mentah QC kanal (batang canal). Entrypoint admin untuk CRUD langsung."
      actions={
        <Link to="/admin/maindata/add" className="btn btn-primary">
          <Icon name="plus-circle" className="h-4 w-4" />
          Tambah
        </Link>
      }
    >
      {isLoading ? (
        <TableSkeleton cols={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="clipboard-list"
          heading="Belum ada main data"
          sub="Buat batang canal pertama untuk mulai menyusun segmen & kedalaman."
          cta={
            <Link to="/admin/maindata/add" className="btn btn-primary">
              <Icon name="plus-circle" className="h-4 w-4" />
              Tambah main data
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold">Batang Canal ID</th>
                <th className="px-4 py-3 font-semibold">Segmen</th>
                <th className="px-4 py-3 font-semibold">Total titik</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d) => {
                const totalPoints = d.canal_data.reduce(
                  (s, seg) => s + (seg.data?.length ?? 0),
                  0,
                );
                return (
                  <tr key={d._id} className="table-row transition">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/data/${d._id}`}
                        className="font-mono font-medium text-brand-700 hover:underline"
                      >
                        {d.batang_canal_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.canal_data.length}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{totalPoints}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="btn btn-ghost input-sm"
                          onClick={() => nav(`/admin/maindata/${d._id}/edit`)}
                        >
                          Edit
                        </button>
                        <Link
                          to={`/admin/data/${d._id}`}
                          className="btn btn-ghost input-sm"
                        >
                          Segmen
                          <Icon name="arrow-right" className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          className="btn btn-danger input-sm"
                          onClick={() => onDelete(d._id, d.batang_canal_id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

export default MainDataList;
