/**
 * Deadline AOI (DOMAIN.md poin 1) — sinkron dgn server. deadline = requestDate + 4 hari.
 * Hari Request Date = hari ke-1, window total 5 hari.
 *
 * Port logic dari demo/app.js `deadlineInfo()` + tabel tone DOMAIN.md poin 1:
 *   diff  > 2  → emerald  "Sisa N hari"
 *   diff 1..2  → amber    "Sisa N hari"
 *   diff == 0  → rose     "Deadline hari ini"
 *   diff  < 0  → rose     "LEWAT N hari"
 *
 * Sinkron persis dgn server/src/shared/domain/deadline.ts.
 */
import type { DeadlineInfo } from '../types';

/** Selisih hari kalender (UTC, dibulatkan) antara dua tanggal. */
function diffDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / 86_400_000);
}

export function deadlineInfo(requestDate: Date, now: Date = new Date()): DeadlineInfo {
  const deadline = new Date(requestDate);
  deadline.setDate(deadline.getDate() + 4);

  const daysLeft = diffDays(deadline, now);

  let label: string;
  let tone: DeadlineInfo['tone'];
  if (daysLeft < 0) {
    label = `LEWAT ${Math.abs(daysLeft)} hari`;
    tone = 'rose';
  } else if (daysLeft === 0) {
    label = 'Deadline hari ini';
    tone = 'rose';
  } else if (daysLeft <= 2) {
    label = `Sisa ${daysLeft} hari`;
    tone = 'amber';
  } else {
    label = `Sisa ${daysLeft} hari`;
    tone = 'emerald';
  }

  return { deadline, daysLeft, label, tone };
}
