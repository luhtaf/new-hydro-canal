/**
 * Output filename (DOMAIN.md poin 7).
 * Format: [district-code]-[YYMMDD]-[USV]-[urut][rev][qctype]
 * Contoh:  3C01-260518-KBN01-1R0Q1
 *
 *   district-code : kode distrik 4-char (mis. "3C01")
 *   YYMMDD        : QC Date / Budat
 *   USV           : kode USV operator (mis. "KBN01")
 *   urut          : nomor urut file dalam 1 hari per operator
 *   rev           : "R" + revision (default R0)
 *   qctype        : Q1 = QC, Q2 = RE-QC
 *
 * Catatan: REV di ISI TXT BEDA dgn filename:
 *   REV_in_txt = revision + (qcType == 'RE-QC' ? 1 : 0)
 *
 * Sinkron persis dgn client/src/shared/domain/fileName.ts.
 */
import type { FileNameParams } from '../types.js';

/** Format Date → YYMMDD (mis. 2026-05-18 → "260518"). Pakai komponen lokal. */
function yymmdd(d: Date): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/** Bangun nama file output (tanpa ekstensi). */
export function buildFileName(p: FileNameParams): string {
  const revision = p.revision ?? 0;
  const qctype = p.requestType === 'RE-QC' ? 'Q2' : 'Q1';
  const rev = `R${revision}`;
  return `${p.districtCode}-${yymmdd(p.qcDate)}-${p.usv}-${p.urut}${rev}${qctype}`;
}

/** Hitung nilai REV yang ditulis di ISI TXT (beda dari filename). */
export function revInTxt(revision: number, requestType: FileNameParams['requestType']): number {
  return revision + (requestType === 'RE-QC' ? 1 : 0);
}
