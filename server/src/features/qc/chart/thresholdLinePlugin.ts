/**
 * thresholdLinePlugin — PORT thresholdLinePlugin app lama (ChartController.js).
 *
 * Menggambar garis ambang putus-putus (lulus / tidak lulus) horizontal melintasi
 * chartArea + label kecil di ujung kiri. Nilai threshold dibaca dari `options._header`
 * (config yang sama dipakai headerPlugin) supaya satu sumber. Garis di-render
 * SETELAH bar (afterDatasetsDraw) supaya selalu di atas bar.
 *
 * Skala depth ter-flip (`* -1`): bar makin dalam makin negatif, jadi garis lulus
 * digambar di y = scale(-lulus). DOMAIN.md poin 4/5 (sinkron FE annotation lines).
 */
import type { Chart, Plugin } from 'chart.js';
import { THRESHOLD_HEX } from '../../../shared/domain/threshold.js';
import type { HeaderConfig } from './headerPlugin.js';

function readThreshold(chart: Chart) {
  const opts = chart.options as unknown as { _header?: HeaderConfig };
  return opts._header?.threshold ?? null;
}

export const thresholdLinePlugin: Plugin<'bar'> = {
  id: 'qcThresholdLine',

  afterDatasetsDraw(chart) {
    const t = readThreshold(chart);
    if (!t) return;
    const { ctx, chartArea } = chart;
    const yScale = chart.scales.y;
    if (!yScale) return;

    const lines: Array<[value: number, color: string, label: string]> = [
      [t.lulus, THRESHOLD_HEX.pass, `LULUS ${t.lulus.toFixed(2)}`],
      [t.tidakLulus, THRESHOLD_HEX.fail, `TIDAK LULUS ${t.tidakLulus.toFixed(2)}`],
    ];

    ctx.save();
    for (const [value, color, label] of lines) {
      // depth ter-flip → garis di posisi negatif value.
      const y = yScale.getPixelForValue(-value);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label chip di ujung kiri garis.
      ctx.font = '600 10px Inter, Arial, sans-serif';
      const w = ctx.measureText(label).width + 8;
      ctx.fillStyle = color;
      ctx.fillRect(chartArea.left, y - 14, w, 13);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, chartArea.left + 4, y - 4);
    }
    ctx.restore();
  },
};
