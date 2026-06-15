/**
 * Helper murni [reports] — math tanpa DB, supaya bisa di-unit-test mandiri
 * (agregasi Mongo butuh integrasi terpisah, lihat reports.service.test.ts).
 */

/** Bulatkan ke 1 desimal. */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Persentase aman pembagian-nol, 1 desimal. */
export const pct = (num: number, den: number): number =>
  den === 0 ? 0 : round1((num / den) * 100);

/** Window [from, prevFrom) untuk perbandingan delta periode. */
export function windows(days: number, now: number = Date.now()): {
  from: Date;
  prevFrom: Date;
} {
  const span = days * 24 * 60 * 60 * 1000;
  return {
    from: new Date(now - span),
    prevFrom: new Date(now - 2 * span),
  };
}
