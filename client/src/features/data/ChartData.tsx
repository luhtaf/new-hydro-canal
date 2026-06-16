/**
 * ChartData (`/admin/data/:id/chart`) — port `ChartData.js` (chart drag existing).
 * :id = canal_data segment id. Grafik draggable + threshold lines.
 *
 * Flow onDragEnd (PLAN-FE "Komponen kunci"):
 *   1. rawDepthFromFinal (reverse formula, DOMAIN.md poin 4)
 *   2. simpan via PATCH /updatechartdata/:id (useSaveDragEdit)
 *   3. re-color bar (di dalam DepthChart, live)
 *   4. toast "masuk antrian sync"
 *
 * Catatan: flow lapangan operator menulis ke PouchDB dulu (offline-first, slice sync);
 * di sini = jalur admin online → langsung API. Toast tetap pakai bahasa "antrian sync"
 * untuk konsistensi UX dgn demo.
 */
import { useParams, Link } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, EmptyState, ErrorState } from './components/states.js';
import { DepthChart } from './components/DepthChart.js';
import { useSegmentChart, useSaveDragEdit } from './hooks.js';
import { useThreshold } from './useThreshold.js';

export function ChartData() {
  const { id = '' } = useParams();
  const { data, isLoading, isError, refetch } = useSegmentChart(id);
  const { threshold } = useThreshold();
  const save = useSaveDragEdit(id);

  if (isLoading) {
    return (
      <PageShell title="Grafik Kedalaman">
        <TableSkeleton rows={2} cols={1} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Grafik Kedalaman">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }
  if (data.points.length === 0) {
    return (
      <PageShell title="Grafik Kedalaman">
        <EmptyState
          icon="line-chart"
          heading="Belum ada titik kedalaman"
          sub="Import Excel page 3 atau tambah titik di halaman kedalaman."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Grafik Kedalaman"
      subtitle={
        <span className="font-mono text-slate-400">{data.segment.canal_id}</span>
      }
      actions={
        <Link to={`/admin/data/${id}/chart/preview`} className="btn btn-ghost">
          <Icon name="line-chart" className="h-4 w-4" />
          Preview export
        </Link>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-card p-5">
        <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Icon name="info" className="h-3.5 w-3.5" />
          Tarik batang ke atas/bawah untuk koreksi kedalaman. Otomatis dihitung
          balik ke raw depth lalu disimpan.
        </p>
        <DepthChart
          segment={data.segment}
          points={data.points}
          threshold={threshold}
          draggable
          onCommit={(point, rawDepth, displayed) => {
            save.mutate(
              { pointId: point._id ?? String(point.sta), depth: rawDepth },
              {
                onSuccess: () =>
                  toast(
                    `STA ${point.sta} → ${Math.abs(displayed).toFixed(3)} m · masuk antrian sync`,
                    'ok',
                  ),
                onError: () => toast('Gagal menyimpan koreksi', 'err'),
              },
            );
          }}
        />
      </div>
    </PageShell>
  );
}

export default ChartData;
