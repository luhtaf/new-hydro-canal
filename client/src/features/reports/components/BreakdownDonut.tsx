/**
 * BreakdownDonut — donut pass/tolerance/fail (port demo #report-donut). Cutout
 * 65%, hoverOffset. Legend angka di bawah (emerald/amber/rose) = port grid 3 kolom.
 */
import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js/auto';
import { ChartCanvas } from './ChartCanvas.js';
import type { QualityBreakdown } from '../api.js';

export function BreakdownDonut({ data }: { data: QualityBreakdown }) {
  const config = useMemo<ChartConfiguration>(() => {
    return {
      type: 'doughnut',
      data: {
        labels: ['Pass', 'Tolerance', 'Fail'],
        datasets: [
          {
            data: [data.pass, data.tolerance, data.fail],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false }, tooltip: { displayColors: false } },
      },
    };
  }, [data]);

  return (
    <>
      <ChartCanvas config={config} ariaLabel="Breakdown kualitas QC" />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="font-bold tabular-nums text-emerald-600">{data.pass}</div>
          <div className="text-slate-500">pass</div>
        </div>
        <div>
          <div className="font-bold tabular-nums text-amber-600">{data.tolerance}</div>
          <div className="text-slate-500">tol</div>
        </div>
        <div>
          <div className="font-bold tabular-nums text-rose-600">{data.fail}</div>
          <div className="text-slate-500">fail</div>
        </div>
      </div>
    </>
  );
}
