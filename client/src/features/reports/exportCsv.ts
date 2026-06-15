/**
 * Export CSV produktivitas operator — REAL export (demo touch "real export",
 * bukan stub): bikin Blob CSV + trigger download di browser. Tanpa dep eksternal.
 */
import type { OperatorStat, ReportPeriod } from './api.js';

/** Escape sel CSV (bungkus quote kalau ada koma/quote/newline). */
function cell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Susun CSV operator productivity & picu unduhan. Aman saat list kosong (header saja).
 * Nama file: produktivitas-operator-<period>d-<YYYY-MM-DD>.csv
 */
export function exportOperatorsCsv(rows: OperatorStat[], period: ReportPeriod): void {
  const header = ['Operator', 'USV', 'Kanal', 'Pass rate (%)', 'Re-QC (%)'];
  const lines = rows.map((r) =>
    [r.name, r.usv ?? '', r.kanal, r.passRate, r.reqcRatio].map(cell).join(','),
  );
  const csv = [header.map(cell).join(','), ...lines].join('\n');

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `produktivitas-operator-${period}d-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
