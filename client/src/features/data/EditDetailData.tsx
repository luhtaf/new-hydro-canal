/**
 * EditDetailData (`/admin/data/:id/detail/:detailId/edit`) — port `EditDetailData.js`.
 * Edit 1 titik kedalaman. :id = segment id, :detailId = depth point id.
 * PATCH /detaildata/:detailId. Tampilkan displayed depth + status threshold live.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, ErrorState } from './components/states.js';
import { useDetail, useSegment, useUpdateDetail } from './hooks.js';
import { useThreshold } from './useThreshold.js';
import { displayedDepth, depthClass } from './depthMath.js';

interface PointForm {
  sta: string;
  sta_distance: string;
  depth: string;
  lattitude: string;
  longitude: string;
}

export function EditDetailData() {
  const { id = '', detailId = '' } = useParams();
  const nav = useNavigate();
  const detail = useDetail(detailId);
  const segment = useSegment(id);
  const { threshold } = useThreshold();
  const update = useUpdateDetail(detailId, id);
  const [v, setV] = useState<PointForm>({
    sta: '',
    sta_distance: '',
    depth: '',
    lattitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (detail.data) {
      setV({
        sta: String(detail.data.sta),
        sta_distance: String(detail.data.sta_distance),
        depth: String(detail.data.depth),
        lattitude: String(detail.data.lattitude),
        longitude: String(detail.data.longitude),
      });
    }
  }, [detail.data]);

  if (detail.isLoading || segment.isLoading) {
    return (
      <PageShell title="Edit Titik Kedalaman">
        <TableSkeleton rows={3} cols={2} />
      </PageShell>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <PageShell title="Edit Titik Kedalaman">
        <ErrorState onRetry={() => detail.refetch()} />
      </PageShell>
    );
  }

  const set = (k: keyof PointForm, val: string) =>
    setV((s) => ({ ...s, [k]: val }));

  const rawDepth = parseFloat(v.depth) || 0;
  const disp = segment.data ? displayedDepth(rawDepth, segment.data) : -rawDepth;
  const cls = depthClass(disp, threshold);
  const clsLabel = { pass: 'Lulus', tolerance: 'Toleransi', fail: 'Tidak lulus' }[cls];
  const clsBadge = {
    pass: 'bg-emerald-100 text-emerald-700',
    tolerance: 'bg-amber-100 text-amber-700',
    fail: 'bg-rose-100 text-rose-700',
  }[cls];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        sta: parseFloat(v.sta) || 0,
        sta_distance: parseFloat(v.sta_distance) || 0,
        depth: rawDepth,
        lattitude: parseFloat(v.lattitude) || 0,
        longitude: parseFloat(v.longitude) || 0,
      },
      {
        onSuccess: () => {
          toast('Titik diperbarui · masuk antrian sync', 'ok');
          nav(`/admin/data/${id}/detail`);
        },
        onError: () => toast('Gagal menyimpan', 'err'),
      },
    );
  };

  const F = ({
    label,
    name,
    mono,
  }: {
    label: string;
    name: keyof PointForm;
    mono?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={v[name]}
        onChange={(e) => set(name, e.target.value)}
        className={`input input-sm ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );

  return (
    <PageShell title="Edit Titik Kedalaman">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-card p-6 max-w-2xl space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="STA" name="sta" mono />
          <F label="STA distance" name="sta_distance" mono />
          <F label="Depth (raw, m)" name="depth" mono />
          <F label="Latitude" name="lattitude" mono />
          <F label="Longitude" name="longitude" mono />
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
          <span className="text-xs text-slate-500">Displayed depth:</span>
          <span className="font-mono text-sm font-semibold text-slate-800">
            {Math.abs(disp).toFixed(3)} m
          </span>
          <span className={`badge ${clsBadge}`}>{clsLabel}</span>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button type="submit" className="btn btn-primary" disabled={update.isPending}>
            <Icon name="check" className="h-4 w-4" />
            Simpan perubahan
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => nav(`/admin/data/${id}/detail`)}
          >
            Batal
          </button>
        </div>
      </form>
    </PageShell>
  );
}

export default EditDetailData;
