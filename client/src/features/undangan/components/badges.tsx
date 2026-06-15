/**
 * Badge presentational slice undangan: DeadlineBadge (pakai shared/domain deadlineInfo)
 * + StatusBadge (status flow canal). Visual = demo `aoiStatusBadge` + tone deadline.
 * Slice-local (cuma dipakai page undangan) → bukan kandidat shared (guardrail #1).
 */
import { deadlineInfo } from '../../../shared/domain/deadline.js';
import type { CanalStatus, Tone } from '../../../shared/types.js';

/** Token kelas Tailwind per tone (sinkron demo: bg-{tone}-50 text-{tone}-700). */
const TONE_CLASS: Record<Tone, { wrap: string; dot: string }> = {
  emerald: { wrap: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  amber: { wrap: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  rose: { wrap: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  slate: { wrap: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
  brand: { wrap: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500' },
};

/** Mapping status canal → tone + apakah dot berdenyut (In Progress). */
const STATUS_TONE: Record<CanalStatus, { tone: Tone; pulse?: boolean }> = {
  Submitted: { tone: 'slate' },
  Assigned: { tone: 'amber' },
  'In Progress': { tone: 'brand', pulse: true },
  Done: { tone: 'emerald' },
};

interface DeadlineBadgeProps {
  /** ISO string atau Date Request Date. */
  requestDate: string | Date;
  now?: Date;
  className?: string;
}

/** Badge countdown deadline (DOMAIN poin 1) — tone rose/amber/emerald. */
export function DeadlineBadge({ requestDate, now, className }: DeadlineBadgeProps) {
  const req = requestDate instanceof Date ? requestDate : new Date(requestDate);
  const info = deadlineInfo(req, now);
  const t = TONE_CLASS[info.tone];
  const dl = info.deadline.toISOString().slice(0, 10);
  return (
    <span
      className={`badge ${t.wrap} ${className ?? ''}`}
      title={`Deadline ${dl}`}
    >
      <span className={`badge-dot ${t.dot}`} />
      {info.label}
    </span>
  );
}

interface StatusBadgeProps {
  status: CanalStatus;
  className?: string;
}

/** Badge status flow canal (Submitted/Assigned/In Progress/Done). */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_TONE[status] ?? STATUS_TONE.Submitted;
  const t = TONE_CLASS[meta.tone];
  return (
    <span className={`badge ${t.wrap} ${className ?? ''}`}>
      <span className={`badge-dot ${t.dot} ${meta.pulse ? 'animate-pulse-dot' : ''}`} />
      {status}
    </span>
  );
}
