/**
 * ChartPreview (`/admin/data/:id/chart/preview`) — port `ChartPreview.js`.
 * Tampilan read-only chart + header meta (mirip output PNG server chartjs-node-canvas).
 * :id = segment id. Tidak draggable. Tombol Export PNG (server-side bulk).
 *
 * Header meta: contractor shortName (DOMAIN.md poin 8) + filename (DOMAIN.md poin 7).
 */
import { useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { shortName } from '../../shared/domain/shortName.js';
import { buildFileName } from '../../shared/domain/fileName.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, EmptyState, ErrorState } from './components/states.js';
import { DepthChart } from './components/DepthChart.js';
import { useSegmentChart } from './hooks.js';
import { exportAllChart } from './api.js';
import { useThreshold } from './useThreshold.js';
import type { RequestType } from '../../shared/types.js';

export function ChartPreview() {
  const { id = '' } = useParams();
  const { data, isLoading, isError, refetch } = useSegmentChart(id);
  const { threshold } = useThreshold();

  if (isLoading) {
    return (
      <PageShell title="Preview Chart Export">
        <TableSkeleton rows={2} cols={1} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Preview Chart Export">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }
  if (data.points.length === 0) {
    return (
      <PageShell title="Preview Chart Export">
        <EmptyState icon="line-chart" heading="Belum ada titik kedalaman" />
      </PageShell>
    );
  }

  const seg = data.segment;
  const qcType: RequestType = seg.qc_type === 'RE-QC' ? 'RE-QC' : 'QC';
  const filename = (() => {
    try {
      return buildFileName({
        districtCode: seg.district?.code || '----',
        qcDate: seg.qc_date ? new Date(seg.qc_date) : new Date(),
        usv: seg.usv_code || 'KBN00',
        urut: 1,
        revision: parseInt(seg.revision, 10) || 0,
        requestType: qcType,
      });
    } catch {
      return '(filename tidak tersedia)';
    }
  })();

  const onExport = async () => {
    try {
      // export pakai parent MainData jika tersedia; di sini fallback ke segment id-nya.
      const blob = await exportAllChart(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export PNG diunduh', 'ok');
    } catch {
      toast('Gagal export PNG', 'err');
    }
  };

  return (
    <PageShell
      title="Preview Chart Export"
      subtitle="Tampilan sesuai output PNG server (header + threshold lines)."
      actions={
        <button className="btn btn-primary" onClick={onExport}>
          <Icon name="line-chart" className="h-4 w-4" />
          Export PNG
        </button>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        {/* Header meta ala output chart */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {shortName(seg.content_name || seg.canal_id)} ·{' '}
                <span className="font-mono">{seg.canal_id}</span>
              </p>
              <p className="text-xs text-slate-500">
                STA {seg.start}–{seg.end} · {seg.district?.name} ·{' '}
                Order {seg.order_no}
              </p>
            </div>
            <span className="badge bg-slate-200 text-slate-700 font-mono">
              {filename}.txt
            </span>
          </div>
        </div>
        <div className="p-5">
          <DepthChart
            segment={seg}
            points={data.points}
            threshold={threshold}
            draggable={false}
          />
        </div>
      </div>
    </PageShell>
  );
}

export default ChartPreview;
