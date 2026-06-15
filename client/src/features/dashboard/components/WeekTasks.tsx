/**
 * WeekTasks — "Penugasan minggu ini" + "Status QC terbaru". Port demo
 * `#dashboard-tasks` (kiri lebar 2 kolom) + panel "Status QC terbaru" (kanan).
 *
 * Penugasan: tiap baris = avatar mono 4-digit canal + canal·distrik + meta
 * (region·panjang·order) + badge deadline (shared/domain/deadline). Link ke
 * /penugasan/:canalId. Status QC: 3 baris ikon pass/tolerance/fail + persen.
 *
 * Slice-local. Konsumsi data turunan dari hooks (recentQc) + list penugasan.
 */
import { Link } from 'react-router-dom';
import { Icon } from '../../../shared/layout/Icon.js';
import { deadlineInfo } from '../../../shared/domain/deadline.js';
import type { QcRow, QcClass, TaskRow } from '../hooks.js';

const QC_VISUAL: Record<QcClass, { icon: 'check' | 'alert-triangle' | 'x'; box: string; badge: string }> = {
  pass: { icon: 'check', box: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  tolerance: { icon: 'alert-triangle', box: 'bg-amber-50 text-amber-600', badge: 'bg-amber-50 text-amber-700' },
  fail: { icon: 'x', box: 'bg-rose-50 text-rose-600', badge: 'bg-rose-50 text-rose-700' },
};

export function WeekTasks({ tasks, loading }: { tasks: TaskRow[]; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-soft">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="sec-title">Penugasan minggu ini</div>
        <Link to="/penugasan" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          Lihat semua →
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-slate-100 shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-1/2 rounded bg-slate-100 shimmer" />
                <div className="h-2.5 w-3/4 rounded bg-slate-100 shimmer" />
              </div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <Icon name="clipboard-list" className="mx-auto mb-2 h-7 w-7" />
            <div className="text-sm">Belum ada penugasan minggu ini.</div>
          </div>
        ) : (
          tasks.map((t) => {
            const dl = t.requestDate ? deadlineInfo(new Date(t.requestDate)) : null;
            return (
              <Link
                key={`${t.canalId}-${t.orderNo}`}
                to={`/penugasan/${encodeURIComponent(t.canalId)}`}
                className="flex items-center gap-3 p-4 transition hover:bg-slate-50"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 font-mono text-[10px] font-bold text-brand-700">
                  {t.canalId.slice(-4)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {t.canalId} · <span className="font-normal text-slate-500">{t.district}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {t.region} · {t.panjang}m · order {t.orderNo}
                    {dl && (
                      <>
                        {' · '}
                        <span className={`font-semibold text-${dl.tone}-600`}>{dl.label}</span>
                      </>
                    )}
                  </div>
                </div>
                <Icon name="arrow-right" className="ml-2 h-4 w-4 text-slate-300" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RecentQc({ rows, loading }: { rows: QcRow[]; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-soft">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="sec-title">Status QC terbaru</div>
        <Link to="/qc" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          QC →
        </Link>
      </div>
      <div className="space-y-3 p-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-slate-100 shimmer" />
                <div className="h-2.5 w-1/3 rounded bg-slate-100 shimmer" />
              </div>
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">Belum ada hasil QC.</div>
        ) : (
          rows.map((r, i) => {
            const v = QC_VISUAL[r.cls];
            return (
              <div key={`${r.label}-${i}`} className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${v.box}`}>
                  <Icon name={v.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-slate-500">{r.sub}</div>
                </div>
                <span className={`badge ${v.badge}`}>{r.pct}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
