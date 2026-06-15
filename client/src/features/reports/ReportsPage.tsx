/**
 * ReportsPage — Reports & Analytics (`/reports`, ADMIN-ONLY). Port demo
 * `view-reports` + `renderReports`:
 *   - header + period selector 7/30/90 + Export CSV
 *   - 4 KPI card (KpiCards)
 *   - grid 2: TrendChart (line) + RegionChart (bar)
 *   - grid 3: OperatorTable (2 kol) + BreakdownDonut (1 kol)
 *
 * Data dari 5 endpoint agregasi (TanStack Query, per-period cache). Default export
 * → diwire di router sebagai route `/reports` di bawah <RequireAdmin> (lihat wiring).
 * Visual premium: data-density tinggi, palet restrained + aksen brand, Lucide 1 weight.
 */
import { useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import type { ReportPeriod } from './api.js';
import {
  useReportBreakdown,
  useReportKpi,
  useReportOperator,
  useReportRegion,
  useReportTrend,
} from './hooks.js';
import { PeriodSelector } from './components/PeriodSelector.js';
import { KpiCards } from './components/KpiCards.js';
import { ReportCard } from './components/ReportCard.js';
import { TrendChart } from './components/TrendChart.js';
import { RegionChart } from './components/RegionChart.js';
import { BreakdownDonut } from './components/BreakdownDonut.js';
import { OperatorTable } from './components/OperatorTable.js';
import { exportOperatorsCsv } from './exportCsv.js';

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  7: '7 hari terakhir',
  30: '30 hari terakhir',
  90: '90 hari terakhir',
};

/** Skeleton tinggi chart saat loading (anti layout-shift). */
function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="shimmer rounded-lg bg-slate-100" style={{ height }} />;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>(30);

  const kpi = useReportKpi(period);
  const trend = useReportTrend(period, 'day');
  const region = useReportRegion(period);
  const operator = useReportOperator(period);
  const breakdown = useReportBreakdown(period);

  const anyError =
    kpi.isError || trend.isError || region.isError || operator.isError || breakdown.isError;

  const handleExport = () => {
    exportOperatorsCsv(operator.data ?? [], period);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Insight pass rate, produktivitas, dan distribusi kualitas QC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            className="btn btn-ghost"
            onClick={handleExport}
            disabled={(operator.data ?? []).length === 0}
          >
            <Icon name="download" className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>

      {anyError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Icon name="alert-triangle" className="-mt-0.5 mr-1.5 inline h-4 w-4" />
          Sebagian data laporan gagal dimuat. Coba ganti periode atau muat ulang.
        </div>
      )}

      {/* KPI */}
      <KpiCards kpi={kpi.data} loading={kpi.isLoading} />

      {/* Trend + Region */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard title="Pass rate trend" aside={PERIOD_LABEL[period]}>
          {trend.isLoading ? <ChartSkeleton /> : <TrendChart data={trend.data ?? []} />}
        </ReportCard>
        <ReportCard title="Per region" aside="% pass rate">
          {region.isLoading ? <ChartSkeleton /> : <RegionChart data={region.data ?? []} />}
        </ReportCard>
      </div>

      {/* Operator table + Breakdown donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft lg:col-span-2">
          <div className="border-b border-slate-100 px-4 py-3 text-[13px] font-semibold tracking-tight text-slate-700">
            Produktivitas operator
          </div>
          <OperatorTable rows={operator.data ?? []} loading={operator.isLoading} />
        </div>
        <ReportCard title="Breakdown kualitas">
          {breakdown.isLoading ? (
            <ChartSkeleton />
          ) : (
            <BreakdownDonut data={breakdown.data ?? { pass: 0, tolerance: 0, fail: 0 }} />
          )}
        </ReportCard>
      </div>
    </div>
  );
}
