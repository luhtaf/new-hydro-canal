/**
 * StatCard — KPI stat card dashboard. Port demo `.stat-card` (4 kartu KPI).
 *
 * Visual premium (kiblat Linear/Vercel): border halus + shadow-soft, label
 * uppercase tracking-wider kecil, angka besar tabular-nums (anti-goyang), 1 aksen
 * warna (badge/trend) per kartu. Icon Lucide 1 weight. Slice-local.
 */
import type { ReactNode } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import type { IconName } from '../../../shared/lib/icon.js';

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'slate';

const TONE: Record<Tone, { badge: string; dot: string; icon: string }> = {
  brand: { badge: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500', icon: 'text-brand-500' },
  emerald: { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', icon: 'text-emerald-500' },
  amber: { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', icon: 'text-amber-500' },
  rose: { badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', icon: 'text-rose-500' },
  slate: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: 'text-slate-400' },
};

interface Props {
  label: string;
  /** angka utama (sudah diformat). */
  value: ReactNode;
  /** unit kecil di kanan angka, mis. "%". */
  unit?: string;
  /** keterangan baris bawah. */
  hint?: ReactNode;
  icon?: IconName;
  /** badge pojok kanan-atas (mis. jumlah/"tertunda"). Override icon. */
  badge?: { text: string; tone: Tone; pulse?: boolean };
  tone?: Tone;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  badge,
  tone = 'slate',
  loading,
}: Props) {
  const t = TONE[tone];
  return (
    <div className="stat-card rounded-xl border border-slate-200 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        {badge ? (
          <span className={`badge ${TONE[badge.tone].badge}`}>
            <span
              className={`badge-dot ${TONE[badge.tone].dot} ${badge.pulse ? 'animate-pulse-dot' : ''}`}
            />
            {badge.text}
          </span>
        ) : icon ? (
          <Icon name={icon} className={`h-4 w-4 ${t.icon}`} />
        ) : null}
      </div>
      {loading ? (
        <div className="mt-2.5 h-8 w-16 rounded bg-slate-100 shimmer" />
      ) : (
        <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
          {value}
          {unit && <span className="text-base font-medium text-slate-400">{unit}</span>}
        </div>
      )}
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
