/**
 * PeriodSelector — segmented control 7/30/90 hari (port pill demo view-reports).
 * Aktif = bg-brand-50 + brand-700; lainnya teks slate. Inline-flex dalam kontainer
 * bordered shadow-soft, rounded-lg, padding 0.5 (premium, anti-AI-generik).
 */
import type { ReportPeriod } from '../api.js';

const OPTIONS: ReportPeriod[] = [7, 30, 90];

interface Props {
  value: ReportPeriod;
  onChange: (p: ReportPeriod) => void;
}

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Periode laporan"
      className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-soft"
    >
      {OPTIONS.map((p) => {
        const active = p === value;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {p} hari
          </button>
        );
      })}
    </div>
  );
}
