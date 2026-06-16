/**
 * MultiFieldResolver — kartu konflik parameter (multi-field).
 *
 * Demo ref: index.html template view-konflik article kedua (tabel per-field +
 * dropdown lokal/server). Field yang sama (tidak berubah) ditandai "sama".
 *
 * Strategi default parameter = LWW, tapi UI tetap kasih kontrol per-field.
 * Output: picks map field → side, diteruskan ke conflict.resolveMulti.
 */
import { useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import { diffFields, type Side } from '../../shared/db/conflict.js';
import type { ConflictItem } from '../../shared/types.js';

/** Format nilai sel (number 3 desimal, sisanya as-is). */
function fmt(v: unknown): string {
  if (typeof v === 'number') return v.toFixed(3);
  return String(v ?? '—');
}

export function MultiFieldResolver({
  conflict,
  resolving,
  onResolve,
  onDefer,
}: {
  conflict: ConflictItem;
  resolving: boolean;
  onResolve: (picks: Record<string, Side>) => void;
  onDefer: () => void;
}) {
  const diffs = diffFields(conflict);
  const changed = diffs.filter((d) => !d.same);
  // Default tiap field beda = lokal (operator override per-baris).
  const [picks, setPicks] = useState<Record<string, Side>>(() =>
    Object.fromEntries(changed.map((d) => [d.field, 'lokal' as Side])),
  );

  const setAll = (side: Side) =>
    setPicks(Object.fromEntries(changed.map((d) => [d.field, side])));

  return (
    <article className="bg-white rounded-xl border-2 border-amber-200 shadow-soft overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 grid place-items-center text-amber-600">
          <Icon name="settings" className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold font-mono">{conflict.docId}</div>
          <div className="text-xs text-slate-600">
            {changed.length} field berbeda
          </div>
        </div>
        <span className="badge bg-amber-100 text-amber-800">Multi-field</span>
        <span className="text-xs text-slate-500">
          {new Date(conflict.detectedAt).toLocaleTimeString('id-ID')}
        </span>
      </div>

      <div className="p-4">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th className="text-left px-3 py-2">Field</th>
              <th className="text-left px-3 py-2">Lokal (kamu)</th>
              <th className="text-left px-3 py-2">Server</th>
              <th className="text-left px-3 py-2 w-24">Pakai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {diffs.map((d) =>
              d.same ? (
                <tr key={d.field}>
                  <td className="px-3 py-2.5 text-slate-500">{d.field}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{fmt(d.lokal)}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{fmt(d.server)}</td>
                  <td className="px-3 py-2.5 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Icon name="check" className="w-3.5 h-3.5" />
                    sama
                  </td>
                </tr>
              ) : (
                <tr key={d.field} className="bg-amber-50/40">
                  <td className="px-3 py-2.5 font-semibold">{d.field}</td>
                  <td className="px-3 py-2.5 font-mono text-emerald-700 font-semibold">{fmt(d.lokal)}</td>
                  <td className="px-3 py-2.5 font-mono text-rose-700 font-semibold">{fmt(d.server)}</td>
                  <td className="px-3 py-2.5">
                    <select
                      className="input input-sm"
                      value={picks[d.field] ?? 'lokal'}
                      onChange={(e) =>
                        setPicks((p) => ({ ...p, [d.field]: e.target.value as Side }))
                      }
                    >
                      <option value="lokal">lokal</option>
                      <option value="server">server</option>
                    </select>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost text-xs" onClick={() => setAll('lokal')} disabled={resolving}>
          <Icon name="zap" className="w-3.5 h-3.5" />
          Pilih semua lokal
        </button>
        <button className="btn btn-ghost text-xs" onClick={() => setAll('server')} disabled={resolving}>
          <Icon name="cloud-upload" className="w-3.5 h-3.5" />
          Pilih semua server
        </button>
        <div className="ml-auto flex gap-2">
          <button className="btn btn-ghost text-xs" onClick={onDefer} disabled={resolving}>
            Tangguhkan
          </button>
          <button
            className="btn btn-primary text-xs"
            onClick={() => onResolve(picks)}
            disabled={resolving}
          >
            <Icon name="git-merge" className="w-3.5 h-3.5" />
            Gabungkan
          </button>
        </div>
      </div>
    </article>
  );
}
