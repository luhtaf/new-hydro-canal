/**
 * ThresholdLegend — preview legend warna threshold (demo `#threshold-preview`).
 * PASS ≥ lulus · batasAwal ≤ TOL < batasAkhir · NOT PASS < tidakLulus.
 * Pakai THRESHOLD_HEX dari shared/domain supaya warna sinkron dgn chart + BE.
 */
import { THRESHOLD_HEX } from '../../../shared/domain/threshold.js';
import type { Threshold } from '../../../shared/types.js';

function fmt(n: number): string {
  return n.toFixed(2);
}

export function ThresholdLegend({ t }: { t: Threshold }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="inline-flex items-center gap-1.5 font-mono font-semibold" style={{ color: THRESHOLD_HEX.pass }}>
        <span className="h-2 w-2 rounded-full" style={{ background: THRESHOLD_HEX.pass }} />
        PASS ≥ {fmt(t.lulus)}
      </span>
      <span className="text-slate-300">·</span>
      <span className="inline-flex items-center gap-1.5 font-mono font-semibold" style={{ color: THRESHOLD_HEX.tolerance }}>
        <span className="h-2 w-2 rounded-full" style={{ background: THRESHOLD_HEX.tolerance }} />
        {fmt(t.batasAwal)} ≤ TOL &lt; {fmt(t.batasAkhir)}
      </span>
      <span className="text-slate-300">·</span>
      <span className="inline-flex items-center gap-1.5 font-mono font-semibold" style={{ color: THRESHOLD_HEX.fail }}>
        <span className="h-2 w-2 rounded-full" style={{ background: THRESHOLD_HEX.fail }} />
        NOT PASS &lt; {fmt(t.tidakLulus)}
      </span>
    </div>
  );
}
