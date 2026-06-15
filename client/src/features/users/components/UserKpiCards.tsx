/**
 * UserKpiCards — 4 KPI ringkas di atas tabel operator. Port demo stat-card
 * (view-users): Total operator · Admin · USV terpasang · Rata-rata produktivitas.
 *
 * Slice-local (KPI ini spesifik users). Visual selaras StatCard dashboard:
 * border halus + shadow-soft, label uppercase kecil, angka tabular-nums.
 */
import { Icon } from '../../../shared/layout/Icon.js';
import type { IconName } from '../../../shared/lib/icon.js';
import type { UsersKpi } from '../hooks.js';

interface Props {
  kpi: UsersKpi;
  loading?: boolean;
}

export function UserKpiCards({ kpi, loading }: Props) {
  const cards: { label: string; value: string; unit?: string; hint: string; icon: IconName; accent: string }[] = [
    {
      label: 'Total operator',
      value: String(kpi.totalOperator),
      hint: `${kpi.operatorAktif} aktif · ${kpi.operatorCuti} cuti`,
      icon: 'users',
      accent: 'text-brand-500',
    },
    {
      label: 'Admin',
      value: String(kpi.totalAdmin),
      hint: 'Punya akses penuh',
      icon: 'shield-check',
      accent: 'text-amber-500',
    },
    {
      label: 'USV terpasang',
      value: String(kpi.usvTerpasang),
      hint: 'KBN01–KBN05',
      icon: 'zap',
      accent: 'text-emerald-500',
    },
    {
      label: 'Rata-rata produktivitas',
      value: kpi.avgProduktivitas ? String(kpi.avgProduktivitas) : '—',
      unit: kpi.avgProduktivitas ? '/hr' : undefined,
      hint: 'Kanal per operator (30d)',
      icon: 'trending-up',
      accent: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="stat-card rounded-xl border border-slate-200 p-4 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {c.label}
            </div>
            <Icon name={c.icon} className={`h-4 w-4 ${c.accent}`} />
          </div>
          {loading ? (
            <div className="mt-2.5 h-8 w-16 rounded bg-slate-100 shimmer dark:bg-slate-700" />
          ) : (
            <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {c.value}
              {c.unit && <span className="text-base font-medium text-slate-400">{c.unit}</span>}
            </div>
          )}
          <div className="mt-1 text-xs text-slate-500">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}
