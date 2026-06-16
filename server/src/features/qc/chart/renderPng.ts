/**
 * renderPng — PORT existing exportAllChart (ChartController.js) ke chartjs-node-canvas.
 *
 * Render bar chart kedalaman 1 canal ke PNG buffer: nilai = displayed depth (ter-flip
 * `* -1`), warna bar = klasifikasi threshold (pass/tol/fail), + headerPlugin (metadata
 * extend Region/Operator/Status/USV/Kontraktor) + thresholdLinePlugin (garis ambang).
 *
 * Dimensi 1147x722 (sama existing). Final depth formula via shared/domain (sinkron
 * FE drag chart — DOMAIN.md poin 4). Threshold via shared/domain (poin 5).
 */
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';
import { THRESHOLD_HEX } from '../../../shared/domain/threshold.js';
import { headerPlugin, type HeaderConfig, type MetaRow } from './headerPlugin.js';
import { thresholdLinePlugin } from './thresholdLinePlugin.js';
import type { QcContext } from '../qc.context.js';
import { buildQcFileName } from '../qc.filename.js';

const WIDTH = 1147;
const HEIGHT = 722;

// Satu instance canvas; daftar plugin global agar selalu aktif.
const canvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: 'white',
  plugins: { modern: [headerPlugin, thresholdLinePlugin] },
});

function fmtDate(s: string | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

/** Susun baris meta header (EXTEND existing: Region/Operator/Status/USV/Kontraktor). */
function buildMetaRows(ctx: QcContext): MetaRow[] {
  const { canal, segment, operator } = ctx;
  return [
    ['Order No', canal.orderNo],
    ['ID Kanal', canal.canalId],
    ['Region', segment.region ?? '—'],
    ['District', `${ctx.districtCode} · ${canal.district}`],
    ['WL', `${segment.water_level} m`],
    ['Dimensi', canal.dimensi || '—'],
    ['QC Date', fmtDate(segment.qc_date)],
    ['Measure Date', fmtDate(segment.measure_date)],
    ['Operator', operator?.name ?? segment.operator ?? '—'],
    ['USV', canal.usv ?? segment.usv_code ?? '—'],
    ['Status QC', canal.status],
    ['Kontraktor', ctx.contractorShort],
  ];
}

/** Render PNG chart 1 canal → Buffer. */
export async function renderQcPng(ctx: QcContext): Promise<Buffer> {
  const labels = ctx.points.map((p) => String(p.sta));
  const values = ctx.points.map((p) => p.displayed);
  const colors = ctx.points.map((p) =>
    p.klass ? THRESHOLD_HEX[p.klass] : '#94a3b8',
  );

  const header: HeaderConfig = {
    title: buildQcFileName(ctx).base,
    subtitle: `${ctx.contractorShort} · ${canalSummary(ctx)}`,
    metaRows: buildMetaRows(ctx),
    threshold: ctx.threshold,
  };

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Kedalaman (m)',
          data: values,
          backgroundColor: colors,
          borderRadius: 2,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      layout: { padding: { top: 0, right: 40, bottom: 20, left: 20 } },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 24 },
          grid: { display: false },
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: (v) => Math.abs(Number(v)).toFixed(1),
          },
          grid: { color: 'rgba(148,163,184,.15)' },
        },
      },
    },
  };
  // Sisipkan config header untuk plugin (di luar tipe ChartOptions).
  (config.options as unknown as { _header: HeaderConfig })._header = header;

  return canvas.renderToBuffer(config, 'image/png');
}

function canalSummary(ctx: QcContext): string {
  const { pass, tol, fail, total } = ctx.summary;
  return `${total} STA · ${pass} pass / ${tol} tol / ${fail} fail`;
}
