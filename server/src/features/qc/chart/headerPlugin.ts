/**
 * headerPlugin — PORT + EXTEND headerPlugin app lama (ChartController.js).
 *
 * Plugin Chart.js (chartjs-node-canvas) yang menggambar BLOK HEADER metadata di atas
 * area chart sebelum bar di-render: judul (output filename), legend threshold, dan
 * grid meta (ORDER NO / ID KANAL / REGION / DISTRICT / WL / DIMENSI / QC DATE /
 * MEASURE DATE / OPERATOR / USV / STATUS QC / KONTRAKTOR).
 *
 * EXTEND dari existing (PLAN-BE § "Chart PNG renderer" + slide 8 pptx): tambah baris
 * Region, Operator, Status QC, USV, dan Kontraktor (singkatan via shortName). Layout
 * dibuat tahan banyak baris: meta grid 2 kolom, font kecil, supaya muat 1147x722.
 *
 * Kontrak: renderPng menaruh konfigurasi header di `options._header` (lihat tipe
 * HeaderConfig). Plugin menyisihkan ruang atas (chartArea.top) lewat `beforeLayout`
 * dan menggambar di `beforeDraw` agar bar tidak menimpa header.
 */
import type { Chart, Plugin } from 'chart.js';
import { THRESHOLD_HEX } from '../../../shared/domain/threshold.js';
import type { Threshold } from '../../../shared/types.js';

/** 1 baris meta key→value yang digambar di grid header. */
export type MetaRow = [label: string, value: string];

export interface HeaderConfig {
  /** Judul besar = output filename (mis. "3C01-260518-KBN01-1R0Q1"). */
  title: string;
  /** Subjudul kecil di bawah judul (mis. "PT. CBS · D.SUNGAI_BEYUKU"). */
  subtitle?: string;
  /** Baris meta key/value (2-kolom). */
  metaRows: MetaRow[];
  /** Threshold untuk legend pass/tolerance/fail. */
  threshold: Threshold | null;
}

/** Tinggi header dihitung dari jumlah baris meta (2 kolom) + blok judul/legend. */
function headerHeight(cfg: HeaderConfig): number {
  const metaCols = 2;
  const rows = Math.ceil(cfg.metaRows.length / metaCols);
  const TITLE_BLOCK = 64; // judul + subtitle
  const LEGEND_BLOCK = 26;
  const META_ROW_H = 18;
  return TITLE_BLOCK + LEGEND_BLOCK + rows * META_ROW_H + 16;
}

function readConfig(chart: Chart): HeaderConfig | null {
  const opts = chart.options as unknown as { _header?: HeaderConfig };
  return opts._header ?? null;
}

export const headerPlugin: Plugin<'bar'> = {
  id: 'qcHeader',

  // Sisihkan ruang atas untuk header sebelum Chart menghitung chartArea.
  beforeLayout(chart) {
    const cfg = readConfig(chart);
    if (!cfg) return;
    // padding.top mendorong chartArea ke bawah → tak menimpa header.
    const padding = chart.options.layout?.padding;
    const h = headerHeight(cfg);
    if (typeof padding === 'object') {
      (padding as { top?: number }).top = h;
    } else {
      chart.options.layout = { ...(chart.options.layout ?? {}), padding: { top: h } };
    }
  },

  beforeDraw(chart) {
    const cfg = readConfig(chart);
    if (!cfg) return;
    const { ctx } = chart;
    const left = 40;
    const right = chart.width - 40;

    ctx.save();

    // Judul (output filename) — monospace bold.
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Menlo, Consolas, monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(cfg.title, left, 34);

    // Subjudul.
    if (cfg.subtitle) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px Inter, Arial, sans-serif';
      ctx.fillText(cfg.subtitle, left, 54);
    }

    // Legend threshold (kanan atas).
    if (cfg.threshold) {
      const legend: Array<[string, string]> = [
        [THRESHOLD_HEX.pass, `PASS ≥ ${cfg.threshold.lulus.toFixed(2)}`],
        [
          THRESHOLD_HEX.tolerance,
          `TOL ${cfg.threshold.batasAwal.toFixed(2)}–${cfg.threshold.batasAkhir.toFixed(2)}`,
        ],
        [THRESHOLD_HEX.fail, `FAIL < ${cfg.threshold.tidakLulus.toFixed(2)}`],
      ];
      ctx.font = '11px Inter, Arial, sans-serif';
      let x = right;
      // gambar dari kanan ke kiri supaya rata kanan.
      for (let i = legend.length - 1; i >= 0; i--) {
        const [color, label] = legend[i]!;
        const w = ctx.measureText(label).width;
        ctx.fillStyle = '#334155';
        ctx.fillText(label, x - w, 30);
        ctx.fillStyle = color;
        ctx.fillRect(x - w - 18, 20, 12, 11);
        x -= w + 30;
      }
    }

    // Garis pemisah di bawah blok judul.
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, 64);
    ctx.lineTo(right, 64);
    ctx.stroke();

    // Grid meta 2 kolom.
    const metaTop = 80;
    const colW = (right - left) / 2;
    const rowH = 18;
    ctx.font = '12px Inter, Arial, sans-serif';
    cfg.metaRows.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = left + col * colW;
      const cy = metaTop + row * rowH;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label.toUpperCase().padEnd(14), cx, cy);
      const labelW = ctx.measureText(label.toUpperCase().padEnd(14)).width;
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 12px Inter, Arial, sans-serif';
      ctx.fillText(value, cx + labelW + 6, cy);
      ctx.font = '12px Inter, Arial, sans-serif';
    });

    ctx.restore();
  },
};
