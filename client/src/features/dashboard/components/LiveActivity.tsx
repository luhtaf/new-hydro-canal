/**
 * LiveActivity — feed audit live di dashboard. Port demo `#dashboard-activity`.
 *
 * Sumber: `useRecentActivity` (TanStack Query polling 30s /audit/recent). Tiap baris
 * = avatar inisial (warna turunan dari action), pelaku + jenis + target mono, detail
 * + waktu relatif ("3 mnt lalu"). Header punya dot-pulse "Auto-update" (demo touch).
 *
 * Slice-local. Empty/loading state inline supaya home tetap mulus saat endpoint
 * audit belum hidup (api.ts menelan 404 → []).
 */
import { Icon } from '../../../shared/layout/Icon.js';
import type { IconName } from '../../../shared/lib/icon.js';
import type { AuditAction } from '../../../shared/types.js';
import type { ActivityItem } from '../api.js';

/** action → icon Lucide (subset registry). */
const ACTION_ICON: Record<AuditAction, IconName> = {
  edit: 'form-input',
  sync: 'cloud-upload',
  assign: 'users',
  threshold: 'settings',
  login: 'user',
  export: 'printer',
  import: 'hard-drive',
};

/** action → gradient avatar (1 aksen restrained per jenis). */
const ACTION_GRADIENT: Record<AuditAction, string> = {
  edit: 'from-brand-500 to-brand-700',
  sync: 'from-cyan-500 to-cyan-700',
  assign: 'from-violet-500 to-violet-700',
  threshold: 'from-amber-500 to-amber-600',
  login: 'from-slate-500 to-slate-700',
  export: 'from-emerald-500 to-emerald-700',
  import: 'from-sky-500 to-sky-700',
};

/** Waktu relatif locale id-ID dari ISO timestamp. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return 'baru saja';
  const m = Math.round(diffSec / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.round(h / 24);
  return `${d} hari lalu`;
}

interface Props {
  items: ActivityItem[];
  loading?: boolean;
}

export function LiveActivity({ items, loading }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-soft">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="sec-title">Live activity</div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="dot-pulse bg-emerald-500" style={{ width: 8, height: 8 }} />
          Auto-update
        </div>
      </div>

      {loading ? (
        <div className="p-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-1">
              <div className="h-8 w-8 rounded-full bg-slate-100 shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-slate-100 shimmer" />
                <div className="h-2.5 w-1/3 rounded bg-slate-100 shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-10 text-center text-slate-400">
          <Icon name="scroll-text" className="mx-auto mb-2 h-7 w-7" />
          <div className="text-sm">Belum ada aktivitas. Aksi tim muncul di sini secara langsung.</div>
        </div>
      ) : (
        <div className="p-2 divide-y divide-slate-100">
          {items.map((a) => {
            const icon = ACTION_ICON[a.action] ?? 'info';
            const grad = ACTION_GRADIENT[a.action] ?? 'from-slate-500 to-slate-700';
            return (
              <div
                key={a._id}
                className="grid items-center gap-3 px-2 py-2.5"
                style={{ gridTemplateColumns: '32px 1fr auto' }}
              >
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${grad} text-[10px] font-bold text-white`}
                >
                  {a.userInitials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    <b>{a.userName}</b> · {a.kind}{' '}
                    <span className="text-slate-400">→</span>{' '}
                    <span className="font-mono text-xs">{a.target}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {a.detail ? `${a.detail} · ` : ''}
                    <span className="text-slate-400">{relativeTime(a.ts)}</span>
                  </div>
                </div>
                <Icon name={icon} className="h-4 w-4 text-slate-400" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
