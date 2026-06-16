/**
 * KpiCards — 4 KPI card Reports (port demo: Total QC, Pass rate, Re-QC ratio,
 * Rata-rata waktu). Tiap kartu: label uppercase kecil, angka besar tabular-nums,
 * delta vs periode lalu dgn warna+arah (naik=emerald utk metrik baik, amber/rose
 * utk re-qc yang naik). Skeleton shimmer saat loading (anti layout-shift).
 */
import { Icon } from '../../../shared/layout/Icon.js';
import type { ReportKpi } from '../api.js';

/** Format delta jadi label + warna. `goodWhenUp`: naik itu bagus (hijau) atau buruk. */
function deltaView(delta: number, goodWhenUp: boolean, suffix = '') {
  if (delta === 0) return { text: 'stabil', cls: 'text-slate-400', icon: 'minus' as const };
  const up = delta > 0;
  const good = up === goodWhenUp;
  const sign = up ? '+' : '';
  return {
    text: `${sign}${delta}${suffix} vs periode lalu`,
    cls: good ? 'text-emerald-600' : 'text-rose-600',
    icon: (up ? 'trending-up' : 'trending-down') as 'trending-up' | 'trending-down',
  };
}

function Card({
  label,
  value,
  unit,
  valueClass = '',
  delta,
  loading,
}: {
  label: string;
  value: string | number;
  unit?: string;
  valueClass?: string;
  delta?: { text: string; cls: string; icon: 'trending-up' | 'trending-down' | 'minus' };
  loading?: boolean;
}) {
  return (
    <div className="stat-card rounded-xl border border-slate-200 p-4 shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      {loading ? (
        <div className="shimmer mt-2.5 h-8 w-20 rounded bg-slate-100" />
      ) : (
        <div className={`mt-2 text-3xl font-bold tracking-tight tabular-nums ${valueClass}`}>
          {value}
          {unit && <span className="text-base font-medium text-slate-400">{unit}</span>}
        </div>
      )}
      {!loading && delta && (
        <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${delta.cls}`}>
          <Icon name={delta.icon} className="h-3 w-3" />
          {delta.text}
        </div>
      )}
    </div>
  );
}

interface Props {
  kpi?: ReportKpi;
  loading?: boolean;
}

export function KpiCards({ kpi, loading }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="Total QC"
        value={kpi?.totalQc ?? 0}
        delta={kpi ? deltaView(kpi.totalQcDelta, true) : undefined}
        loading={loading}
      />
      <Card
        label="Pass rate rata-rata"
        value={kpi?.passRate ?? 0}
        unit="%"
        valueClass="text-emerald-600"
        delta={kpi ? deltaView(kpi.passRateDelta, true, '%') : undefined}
        loading={loading}
      />
      <Card
        label="Re-QC ratio"
        value={kpi?.reqcRatio ?? 0}
        unit="%"
        valueClass="text-amber-600"
        delta={kpi ? deltaView(kpi.reqcRatioDelta, false, '%') : undefined}
        loading={loading}
      />
      <Card
        label="Rata-rata waktu QC"
        value={kpi?.avgHours ?? 0}
        unit="h"
        loading={loading}
      />
    </div>
  );
}
