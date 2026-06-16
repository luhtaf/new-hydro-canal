/**
 * DepthChart — bar chart kedalaman dengan:
 *  - threshold annotation lines (chartjs-plugin-annotation)
 *  - drag bar (chartjs-plugin-dragdata) → onDragEnd: rawDepthFromFinal → onCommit → toast
 *  - re-color bar live via thresholdStatus (DOMAIN.md poin 5)
 *
 * Wajib identik plugin dgn demo (PLAN-FE "Komponen kunci"): chart.js@4.4.1,
 * chartjs-plugin-annotation@3.0.1, chartjs-plugin-dragdata@2.3.1.
 *
 * Nilai bar = displayed depth (ter-flip * -1, jadi makin dalam makin ke bawah).
 * Saat di-drag: konversi balik ke raw depth (rawFromDisplayed) sebelum commit ke server.
 */
import { useEffect, useRef } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
// chartjs-plugin-dragdata tidak punya tipe default yang rapi; import sebagai plugin.
import dragDataPlugin from 'chartjs-plugin-dragdata';
import type {
  CanalDataSegment,
  DepthPoint,
  Threshold,
} from '../../../shared/types.js';
import {
  displayedDepth,
  rawFromDisplayed,
  depthColor,
} from '../depthMath.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  annotationPlugin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragDataPlugin as any,
);

interface Props {
  segment: CanalDataSegment;
  points: DepthPoint[];
  threshold: Threshold;
  /** kalau false → chart read-only (ChartPreview). */
  draggable?: boolean;
  /**
   * Dipanggil saat user selesai drag 1 bar.
   * @param point titik yang diubah
   * @param rawDepth raw depth hasil reverse formula (untuk disimpan)
   * @param displayed nilai displayed hasil drag
   */
  onCommit?: (point: DepthPoint, rawDepth: number, displayed: number) => void;
  height?: number;
}

export function DepthChart({
  segment,
  points,
  threshold,
  draggable = false,
  onCommit,
  height = 340,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'bar'> | null>(null);
  // simpan callback terbaru tanpa re-create chart.
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const labels = points.map((p) => `STA ${p.sta}`);
    const values = points.map((p) => displayedDepth(p.depth, segment));
    const colors = values.map((v) => depthColor(v, threshold));

    // garis threshold pada nilai displayed (negatif → makin ke bawah).
    const line = (val: number, color: string, label: string) => ({
      type: 'line' as const,
      yMin: -val,
      yMax: -val,
      borderColor: color,
      borderWidth: 1.5,
      borderDash: [6, 4],
      label: {
        display: true,
        content: label,
        position: 'end' as const,
        backgroundColor: color,
        color: '#fff',
        font: { size: 10, weight: 'bold' as const },
        padding: 3,
      },
    });

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Kedalaman (m)',
            data: values,
            backgroundColor: colors,
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 180 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const p = points[ctx.dataIndex];
                const raw = p ? p.depth.toFixed(3) : '—';
                return `Depth ${Math.abs(ctx.parsed.y).toFixed(3)} m · raw ${raw}`;
              },
            },
          },
          annotation: {
            annotations: {
              lulus: line(threshold.lulus, '#10b981', `Lulus ${threshold.lulus}`),
              batasAkhir: line(threshold.batasAkhir, '#f59e0b', `Toleransi ${threshold.batasAkhir}`),
              tidakLulus: line(threshold.tidakLulus, '#f43f5e', `Tidak lulus ${threshold.tidakLulus}`),
            },
          },
          // konfigurasi plugin dragdata
          dragData: draggable
            ? {
                round: 3, // 3 desimal (DOMAIN.md poin 9)
                dragX: false,
                showTooltip: true,
                onDragEnd: (
                  _e: unknown,
                  _dsIndex: number,
                  index: number,
                  value: number,
                ) => {
                  const point = points[index];
                  if (!point) return;
                  const displayed = value;
                  const raw = rawFromDisplayed(displayed, segment);
                  // re-color bar live.
                  const chart = chartRef.current;
                  const ds = chart?.data.datasets[0];
                  if (chart && ds) {
                    const bg = ds.backgroundColor as string[];
                    bg[index] = depthColor(displayed, threshold);
                    chart.update('none');
                  }
                  commitRef.current?.(point, raw, displayed);
                },
              }
            : (false as unknown as object),
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            // depth ter-flip: 0 di atas, makin negatif makin ke bawah.
            reverse: false,
            ticks: {
              font: { size: 10 },
              callback: (v) => Math.abs(Number(v)).toFixed(1),
            },
            grid: { color: '#f1f5f9' },
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, segment, threshold, draggable]);

  return (
    <div style={{ height }} className="relative">
      <canvas ref={canvasRef} aria-label="Grafik kedalaman kanal" role="img" />
    </div>
  );
}
