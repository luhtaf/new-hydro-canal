/**
 * DTO slice [reports] — kontrak wire BE→FE. Bentuk plain object (JSON) yang
 * dikembalikan tiap endpoint. Diduplikat identik di
 * `client/src/features/reports/api.ts` (FE self-contained, pola types.ts shared).
 *
 * Klasifikasi outcome QC (pass/tolerance/fail) diturunkan dari Canal:
 *   - hanya canal status 'Done' yang dihitung sebagai QC selesai.
 *   - RE-QC (requestType === 'RE-QC') = perlu pengukuran ulang → dihitung "tolerance".
 *   - sisanya pass; fail = Done tapi tanpa qcOutput (tidak menghasilkan file).
 * Ini heuristik berbasis field Canal yang ada (belum ada skor per-titik di Canal);
 * begitu slice [qc] menyimpan skor outcome, ganti $switch di service — DTO tetap.
 */

/** Periode laporan: jumlah hari ke belakang. */
export type ReportPeriod = 7 | 30 | 90;

/** Granularitas trend. */
export type TrendGroupBy = 'day' | 'week';

/** 4 KPI utama (top of page). */
export interface ReportKpi {
  /** Total QC selesai (canal Done) dalam periode. */
  totalQc: number;
  /** Delta total vs periode sebelumnya yang sama panjang. */
  totalQcDelta: number;
  /** Pass rate rata-rata (%) — pass / done. */
  passRate: number;
  /** Delta pass rate (poin %) vs periode sebelumnya. */
  passRateDelta: number;
  /** Rasio RE-QC (%) dari total Done. */
  reqcRatio: number;
  reqcRatioDelta: number;
  /** Rata-rata waktu QC per kanal (jam) — assignedAt → updatedAt saat Done. */
  avgHours: number;
}

/** 1 titik trend (per hari/minggu). */
export interface TrendPoint {
  /** ISO date (awal bucket). */
  date: string;
  /** jumlah QC selesai di bucket. */
  done: number;
  /** jumlah pass di bucket. */
  pass: number;
  /** pass rate (%) bucket; 0 kalau done=0. */
  passRate: number;
}

/** Pass rate + volume per region. */
export interface RegionStat {
  region: string;
  done: number;
  pass: number;
  /** pass rate (%) region. */
  passRate: number;
}

/** Produktivitas 1 operator. */
export interface OperatorStat {
  userId: string;
  name: string;
  initials: string;
  usv: string | null;
  /** kanal selesai dalam periode. */
  kanal: number;
  /** pass rate (%). */
  passRate: number;
  /** rasio re-qc (%). */
  reqcRatio: number;
}

/** Donut pass / tolerance / fail. */
export interface QualityBreakdown {
  pass: number;
  tolerance: number;
  fail: number;
}
