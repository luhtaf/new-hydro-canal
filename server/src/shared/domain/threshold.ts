/**
 * Klasifikasi threshold depth (DOMAIN.md poin 5).
 *  depth >= lulus                  → pass (hijau)
 *  batasAwal <= depth < batasAkhir → tolerance (kuning)
 *  depth < tidakLulus              → fail (merah)
 *
 * Sinkron persis dgn client/src/shared/domain/threshold.ts.
 */
import type { Threshold, ThresholdClass } from '../types.js';

/** Warna hex per kelas (FE chart + BE chartjs-node-canvas) — Tailwind emerald/amber/rose 500. */
export const THRESHOLD_HEX: Record<ThresholdClass, string> = {
  pass: '#10b981', // emerald-500
  tolerance: '#f59e0b', // amber-500
  fail: '#f43f5e', // rose-500
};

export function classifyThreshold(depth: number, t: Threshold): ThresholdClass {
  if (depth >= t.lulus) return 'pass';
  if (depth < t.tidakLulus) return 'fail';
  // Zona toleransi: tidakLulus <= depth < lulus (batasAwal/batasAkhir default = tidakLulus/lulus).
  return 'tolerance';
}

/** Warna hex untuk render bar (FE chart + BE chartjs-node-canvas). */
export function thresholdColor(depth: number, t: Threshold): string {
  return THRESHOLD_HEX[classifyThreshold(depth, t)];
}
