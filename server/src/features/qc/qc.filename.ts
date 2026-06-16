/**
 * qc.filename — bangun output filename dari QcContext (DOMAIN.md poin 7).
 *
 * Format: [district-code]-[YYMMDD]-[USV]-[urut][rev][qctype]
 *   - district-code : QcContext.districtCode (4-char dari District)
 *   - YYMMDD        : qc_date segmen (Budat), fallback measure_date
 *   - USV           : usv canal (atau usv_code segmen)
 *   - urut          : nomor urut file dlm 1 hari per operator (default 1)
 *   - rev           : revision segmen (default 0)
 *   - qctype        : Q1 = QC, Q2 = RE-QC (dari Canal.requestType)
 *
 * Pakai helper shared/domain/fileName.buildFileName (sinkron FE) — JANGAN duplikat format.
 */
import { buildFileName, revInTxt } from '../../shared/domain/fileName.js';
import type { QcContext } from './qc.context.js';

/** Parse string tanggal (ISO / YYYY-MM-DD) ke Date; fallback "sekarang". */
function parseDate(s: string | undefined): Date {
  if (!s) return new Date();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Revision number dari string segmen (mis. "001" → 0 utk filename R0). */
function revisionNumber(seg: { revision?: string }): number {
  // filename pakai R0 default; revision di segmen ("001") menaikkan angka R.
  const n = Number(seg.revision);
  if (!Number.isFinite(n)) return 0;
  // "001" diperlakukan sebagai revisi awal → R0; "002" → R1 dst (sesuai pola existing).
  return Math.max(0, n - 1);
}

export interface QcFileName {
  /** nama dasar tanpa ekstensi, mis. "3C01-260518-KBN01-1R0Q1". */
  base: string;
  /** REV yang ditulis di ISI TXT (beda dari filename). */
  revInTxt: number;
}

export function buildQcFileName(ctx: QcContext, urut = 1): QcFileName {
  const { canal, segment, operator } = ctx;
  const usv = canal.usv ?? segment.usv_code ?? operator?.usv ?? 'KBN01';
  const revision = revisionNumber(segment);
  const base = buildFileName({
    districtCode: ctx.districtCode,
    qcDate: parseDate(segment.qc_date || segment.measure_date),
    usv,
    urut,
    revision,
    requestType: canal.requestType,
  });
  return { base, revInTxt: revInTxt(revision, canal.requestType) };
}
