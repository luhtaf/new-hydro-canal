/**
 * Klasifikasi threshold depth (DOMAIN.md poin 5) — sinkron dgn server.
 *  depth >= lulus                  → pass (hijau)
 *  batasAwal <= depth < batasAkhir → tolerance (kuning)
 *  depth < tidakLulus              → fail (merah)
 *
 * Sinkron persis dgn server/src/shared/domain/threshold.ts.
 */
import type { Threshold, ThresholdClass } from '../types';

/** Warna hex per kelas (FE chart + BE chartjs-node-canvas) — Tailwind emerald/amber/rose 500. */
export const THRESHOLD_HEX: Record<ThresholdClass, string> = {
  pass: '#10b981', // emerald-500
  tolerance: '#f59e0b', // amber-500
  fail: '#f43f5e', // rose-500
};

export function classifyThreshold(depth: number, t: Threshold): ThresholdClass {
  if (depth >= t.lulus) return 'pass';
  if (depth < t.tidakLulus) return 'fail';
  return 'tolerance';
}

export function thresholdColor(depth: number, t: Threshold): string {
  return THRESHOLD_HEX[classifyThreshold(depth, t)];
}
