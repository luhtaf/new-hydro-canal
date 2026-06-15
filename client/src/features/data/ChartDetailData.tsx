/**
 * ChartDetailData (`/admin/data/:id/detail/:detailId/chart`) — port + realisasi fitur
 * "detail keterangan di chart" (salah satu dari 5 fitur belum-realisasi app lama,
 * FEEDBACK.md 2025-12-18). :id = segment id, :detailId = depth point id.
 *
 * Chart read-only segment + panel keterangan titik terpilih (STA, raw/displayed depth,
 * status threshold, koordinat). Sorotan titik aktif di legenda samping.
 */
import { useParams } from 'react-router-dom';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, ErrorState, EmptyState } from './components/states.js';
import { DepthChart } from './components/DepthChart.js';
import { useSegmentChart } from './hooks.js';
import { useThreshold } from './useThreshold.js';
import { displayedDepth, depthClass } from './depthMath.js';

const LABEL = { pass: 'Lulus', tolerance: 'Toleransi', fail: 'Tidak lulus' };
const BADGE = {
  pass: 'bg-emerald-100 text-emerald-700',
  tolerance: 'bg-amber-100 text-amber-700',
  fail: 'bg-rose-100 text-rose-700',
};

export function ChartDetailData() {
  const { id = '', detailId = '' } = useParams();
  const { data, isLoading, isError, refetch } = useSegmentChart(id);
  const { threshold } = useThreshold();

  if (isLoading) {
    return (
      <PageShell title="Detail Titik di Grafik">
        <TableSkeleton rows={2} cols={1} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Detail Titik di Grafik">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const point = data.points.find((p) => p._id === detailId);
  if (!point) {
    return (
      <PageShell title="Detail Titik di Grafik">
        <EmptyState
          icon="info"
          heading="Titik tidak ditemukan"
          sub="Titik mungkin sudah dihapus atau id tidak valid."
        />
      </PageShell>
    );
  }

  const disp = displayedDepth(point.depth, data.segment);
  const cls = depthClass(disp, threshold);

  return (
    <PageShell
      title="Detail Titik di Grafik"
      subtitle={
        <span className="font-mono text-slate-400">
          {data.segment.canal_id} · STA {point.sta}
        </span>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-card p-5">
          <DepthChart
            segment={data.segment}
            points={data.points}
            threshold={threshold}
            draggable={false}
          />
        </div>
        <aside className="rounded-xl border border-slate-200 bg-white shadow-card p-5 h-fit">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            Keterangan titik
          </h3>
          <dl className="space-y-2.5 text-sm">
            <Row label="STA" value={String(point.sta)} mono />
            <Row label="STA distance" value={String(point.sta_distance)} mono />
            <Row label="Raw depth" value={`${point.depth.toFixed(3)} m`} mono />
            <Row
              label="Displayed depth"
              value={`${Math.abs(disp).toFixed(3)} m`}
              mono
            />
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <span className={`badge ${BADGE[cls]}`}>{LABEL[cls]}</span>
              </dd>
            </div>
            <Row label="Latitude" value={String(point.lattitude)} mono />
            <Row label="Longitude" value={String(point.longitude)} mono />
            <Row label="Waktu" value={point.time} />
          </dl>
          <button
            className="btn btn-ghost input-sm mt-4 w-full justify-center"
            onClick={() => {
              navigator.clipboard
                ?.writeText(`${point.lattitude}, ${point.longitude}`)
                .then(() => toast('Koordinat disalin', 'ok'))
                .catch(() => toast('Gagal menyalin', 'err'));
            }}
          >
            Salin koordinat
          </button>
        </aside>
      </div>
    </PageShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className={`text-slate-800 text-right truncate ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export default ChartDetailData;
