/**
 * AoiHeaderCards — 3 kartu header AOI (Region / Area / Vendor).
 * Demo touch "AOI header 3-card" (PLAN-FE "Demo subset"). Dipakai di UndanganList
 * & UndanganDetail. Slice-local.
 */
import { Icon } from '../../../shared/layout/Icon.js';
import type { IconName } from '../../../shared/lib/icon.js';

interface Props {
  region: string;
  area: string;
  vendor: string;
}

const CARDS: Array<{ key: keyof Props; label: string; icon: IconName }> = [
  { key: 'region', label: 'Region', icon: 'map' },
  { key: 'area', label: 'Area', icon: 'map-pinned' },
  { key: 'vendor', label: 'Vendor', icon: 'shield-check' },
];

export function AoiHeaderCards(props: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-soft"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name={c.icon} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              {c.label}
            </div>
            <div className="truncate text-sm font-semibold text-slate-900">
              {props[c.key]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
