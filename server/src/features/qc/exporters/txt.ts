/**
 * exporters/txt — format TXT akhir QC (slide-4 pptx + demo exportTXT).
 *
 * Header metadata (output filename + ORDER NO / KANAL ID / DISTRICT / OPERATOR /
 * QC DATE / QC TYPE / REVISION) lalu tabel STA / LAT / LON / DEPTH / STATUS.
 *
 * Catatan REV (DOMAIN.md poin 7): REV di ISI txt = revision + (RE-QC ? 1 : 0),
 * BEDA dari komponen rev di filename. Dipakai `revInTxt` dari buildQcFileName.
 */
import type { QcContext } from '../qc.context.js';
import { buildQcFileName } from '../qc.filename.js';

function fmtDate(s: string | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

export function exportTxt(ctx: QcContext, urut = 1): { filename: string; content: string } {
  const { canal, segment, operator } = ctx;
  const fn = buildQcFileName(ctx, urut);
  const qcType = canal.requestType === 'RE-QC' ? 'Q2 (RE-QC)' : 'Q1 (QC)';

  const header = [
    fn.base,
    `ORDER NO   : ${canal.orderNo}`,
    `KANAL ID   : ${canal.canalId}`,
    `DISTRICT   : ${ctx.districtCode} ${canal.district}`,
    `KONTRAKTOR : ${ctx.contractorShort}`,
    `OPERATOR   : ${operator?.name ?? segment.operator ?? '—'}`,
    `USV        : ${canal.usv ?? segment.usv_code ?? '—'}`,
    `QC DATE    : ${fmtDate(segment.qc_date)}`,
    `MEASURE    : ${fmtDate(segment.measure_date)}`,
    `QC TYPE    : ${qcType}`,
    `REVISION   : ${String(fn.revInTxt).padStart(3, '0')}`,
    '',
    'STA       LAT             LON             DEPTH      STATUS',
    '------    --------------  --------------  --------   --------',
  ];

  const body = ctx.points.map((p) => {
    const status = (p.klass ?? 'n/a').toUpperCase();
    return `${String(p.sta).padEnd(6)}    ${p.lat.toFixed(6).padStart(14)}  ${p.lng
      .toFixed(6)
      .padStart(14)}  ${p.rawDepth.toFixed(3).padStart(8)}   ${status}`;
  });

  return {
    filename: `${fn.base}.txt`,
    content: [...header, ...body, ''].join('\n'),
  };
}
