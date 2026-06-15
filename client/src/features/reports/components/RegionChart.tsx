/**
 * RegionChart — horizontal bar pass rate per region/pelaksana (port demo
 * #report-region). Warna bar by ambang: ≥90 emerald, ≥85 brand, else amber.
 * Tooltip "x% (N QC)".
 */
import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import { ChartCanvas } from './ChartCanvas.js';
import type { RegionStat } from '../api.js';

const barColor = (pass: number): string =>
  pass >= 90 ? '#10b981' : pass >= 85 ? '#0ea5e9' : '#f59e0b';

const tidy = (s: string): string => s.replace(/^PT\.?\s*/i, '');

export function RegionChart({ data }: { data: RegionStat[] }) {
  const config = useMemo<ChartConfiguration>(() => {
    return {
      type: 'bar',
      data: {
        labels: data.map((r) => tidy(r.region)),
        datasets: [
          {
            data: data.map((r) => r.passRate),
            backgroundColor: data.map((r) => barColor(r.passRate)),
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (ctx) => `${ctx.parsed.x}% (${data[ctx.dataIndex]?.done ?? 0} QC)`,
            },
          },
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: { font: { size: 10 }, callback: (v) => `${v}%` },
            grid: { color: 'rgba(148,163,184,.15)' },
          },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    };
  }, [data]);

  return <ChartCanvas config={config} ariaLabel="Pass rate per region" />;
}
