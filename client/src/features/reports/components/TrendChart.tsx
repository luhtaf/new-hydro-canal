/**
 * TrendChart — line pass-rate per hari (port demo #report-trend). Area fill brand
 * tipis, no point, tension halus, y-axis 0–100% adaptif. Tooltip "x% pass".
 */
import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import { ChartCanvas } from './ChartCanvas.js';
import type { TrendPoint } from '../api.js';

function shortLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const config = useMemo<ChartConfiguration>(() => {
    // Tampilkan tiap label ke-5 supaya sumbu-x tidak penuh (mirip demo).
    const labels = data.map((p, i) => (i % 5 === 0 || i === data.length - 1 ? shortLabel(p.date) : ''));
    const values = data.map((p) => p.passRate);
    const minY = values.length ? Math.max(0, Math.floor(Math.min(...values) / 5) * 5 - 5) : 0;

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: { label: (ctx) => `${ctx.parsed.y}% pass` },
          },
        },
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          y: {
            min: minY,
            max: 100,
            ticks: { font: { size: 10 }, callback: (v) => `${v}%` },
            grid: { color: 'rgba(148,163,184,.15)' },
          },
        },
      },
    };
  }, [data]);

  return <ChartCanvas config={config} ariaLabel="Trend pass rate" />;
}
