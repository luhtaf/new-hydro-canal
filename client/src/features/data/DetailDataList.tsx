/**
 * DetailDataList (`/admin/data/:id/detail`) — port `DetailData.js`.
 * Tabel titik kedalaman (DepthPoint) di bawah 1 segment (:id = segment id).
 * Kolom: #, STA, Lat, Lng, Depth (displayed), Status (threshold badge), Aksi.
 * Shift-select range + bulk delete. Link ke chart + add/edit detail.
 */
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { confirmDialog } from '../../shared/layout/confirm.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, EmptyState, ErrorState } from './components/states.js';
import { useSegment, useDeleteDetail } from './hooks.js';
import { useShiftSelect } from './useShiftSelect.js';
import { useThreshold } from './useThreshold.js';
import { displayedDepth, depthClass } from './depthMath.js';
import type { ThresholdClass } from '../../shared/types.js';

const STATUS_BADGE: Record<ThresholdClass, { cls: string; label: string }> = {
  pass: { cls: 'bg-emerald-100 text-emerald-700', label: 'Lulus' },
  tolerance: { cls: 'bg-amber-100 text-amber-700', label: 'Toleransi' },
  fail: { cls: 'bg-rose-100 text-rose-700', label: 'Tidak lulus' },
};

export function DetailDataList() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useSegment(id);
  const { threshold } = useThreshold();
  const delDetail = useDeleteDetail(id);

  const points = data?.data ?? [];
  const ids = points.map((p) => p._id ?? String(p.sta));
  const sel = useShiftSelect(ids);

  const bulkDelete = () => {
    confirmDialog({
      title: `Hapus ${sel.count} titik?`,
      body: 'Titik kedalaman terpilih akan dihapus permanen.',
      confirm: 'Hapus',
      danger: true,
      onConfirm: async () => {
        for (const pid of sel.selected) {
          await delDetail.mutateAsync(pid).catch(() => {});
        }
        toast(`${sel.count} titik dihapus`, 'ok');
        sel.clear();
      },
    });
  };

  if (isLoading) {
    return (
      <PageShell title="Titik Kedalaman">
        <TableSkeleton cols={6} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Titik Kedalaman">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Titik Kedalaman"
      subtitle={<span className="font-mono text-slate-400">{data.canal_id}</span>}
      actions={
        <>
          <Link to={`/admin/data/${id}/chart`} className="btn btn-ghost">
            <Icon name="line-chart" className="h-4 w-4" />
            Chart
          </Link>
          <Link to={`/admin/data/${id}/detail/add`} className="btn btn-primary">
            <Icon name="plus-circle" className="h-4 w-4" />
            Tambah titik
          </Link>
        </>
      }
    >
      {sel.count > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-200 px-4 py-2.5 scale-in">
          <span className="text-sm font-medium text-brand-800">
            {sel.count} titik dipilih
          </span>
          <button className="btn btn-danger input-sm" onClick={bulkDelete}>
            <Icon name="x" className="h-3.5 w-3.5" />
            Hapus terpilih
          </button>
          <button className="btn btn-ghost input-sm" onClick={sel.clear}>
            Batal pilih
          </button>
        </div>
      )}

      {points.length === 0 ? (
        <EmptyState
          icon="ruler"
          heading="Belum ada titik kedalaman"
          sub="Tambah titik manual atau import Excel page 3 dari daftar segmen."
          cta={
            <Link
              to={`/admin/data/${id}/detail/add`}
              className="btn btn-primary"
            >
              <Icon name="plus-circle" className="h-4 w-4" />
              Tambah titik
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={sel.allChecked}
                    onChange={sel.toggleAll}
                    aria-label="Pilih semua"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">STA</th>
                <th className="px-4 py-3 font-semibold">Lat</th>
                <th className="px-4 py-3 font-semibold">Lng</th>
                <th className="px-4 py-3 font-semibold">Depth (m)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {points.map((p, i) => {
                const disp = displayedDepth(p.depth, data);
                const cls = depthClass(disp, threshold);
                const badge = STATUS_BADGE[cls];
                const pid = p._id ?? String(p.sta);
                return (
                  <tr key={pid} className="table-row transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={sel.isSelected(pid)}
                        onClick={(e) =>
                          sel.toggle(i, pid, (e as React.MouseEvent).shiftKey)
                        }
                        onChange={() => {}}
                        aria-label={`Pilih STA ${p.sta}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">{p.sta}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {p.lattitude}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {p.longitude}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {Math.abs(disp).toFixed(3)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {p._id && (
                          <button
                            className="btn btn-ghost input-sm"
                            onClick={() =>
                              nav(`/admin/data/${id}/detail/${p._id}/edit`)
                            }
                          >
                            Edit
                          </button>
                        )}
                        {p._id && (
                          <Link
                            to={`/admin/data/${id}/detail/${p._id}/chart`}
                            className="btn btn-ghost input-sm"
                          >
                            <Icon name="line-chart" className="h-3.5 w-3.5" />
                          </Link>
                        )}
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

export default DetailDataList;
