/**
 * OperatorTable — produktivitas operator (port demo #report-ops). Tiap row: avatar
 * inisial gradient brand, nama, USV mono, kanal/periode, pass-rate badge emerald,
 * re-qc badge amber, distribusi bar stack (pass + reqc). Empty-state kalau kosong.
 */
import { Icon } from '../../../shared/layout/Icon.js';
import type { OperatorStat } from '../api.js';

export function OperatorTable({ rows, loading }: { rows: OperatorStat[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-10 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Icon name="users" className="h-6 w-6" />
        </div>
        <div className="mt-3 font-semibold text-slate-700">Belum ada data operator</div>
        <div className="mt-1 text-sm text-slate-500">
          Produktivitas muncul setelah ada kanal QC selesai pada periode ini.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-2.5 text-left">Operator</th>
            <th className="px-4 py-2.5 text-left">USV</th>
            <th className="px-4 py-2.5 text-left">Kanal</th>
            <th className="px-4 py-2.5 text-left">Pass rate</th>
            <th className="px-4 py-2.5 text-left">Re-QC</th>
            <th className="px-4 py-2.5 text-left">Distribusi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((u) => (
            <tr key={u.userId} className="transition-colors hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
                    {u.initials}
                  </div>
                  <div className="font-semibold">{u.name}</div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.usv ?? '—'}</td>
              <td className="px-4 py-3 font-semibold tabular-nums">{u.kanal}</td>
              <td className="px-4 py-3">
                <span className="badge bg-emerald-50 text-emerald-700">{u.passRate}%</span>
              </td>
              <td className="px-4 py-3">
                <span className="badge bg-amber-50 text-amber-700">{u.reqcRatio}%</span>
              </td>
              <td className="w-32 px-4 py-3">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${u.passRate}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${u.reqcRatio}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
