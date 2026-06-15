/**
 * Jembatan antara field segment legacy (string) → domain helpers (number).
 * Segment menyimpan water_level/bed_float/depth_correction sebagai string (schema lama),
 * tranducer sebagai number. Helper di sini parse-aman lalu delegasi ke shared/domain.
 *
 * JANGAN duplikat formula di sini — selalu lewat shared/domain/depth.ts supaya
 * sinkron FE↔BE (DOMAIN.md poin 4).
 */
import { finalDepth, reverseDepth } from '../../shared/domain/depth.js';
import { classifyThreshold, THRESHOLD_HEX } from '../../shared/domain/threshold.js';
import type {
  CanalDataSegment,
  DepthParams,
  Threshold,
  ThresholdClass,
} from '../../shared/types.js';

const num = (v: string | number | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
};

/** Ambil bagian non-depth dari parameter formula dari sebuah segment. */
export function segmentDepthParams(seg: CanalDataSegment): Omit<DepthParams, 'depth'> {
  return {
    water_level: num(seg.water_level),
    tranducer: num(seg.tranducer),
    bed_float: num(seg.bed_float),
    depth_correction: num(seg.depth_correction),
  };
}

/** displayed depth (ter-flip * -1) untuk 1 raw depth pada segment tertentu. */
export function displayedDepth(rawDepth: number, seg: CanalDataSegment): number {
  return finalDepth({ depth: rawDepth, ...segmentDepthParams(seg) });
}

/** raw depth dari displayed (untuk simpan hasil drag). */
export function rawFromDisplayed(displayed: number, seg: CanalDataSegment): number {
  return reverseDepth(displayed, segmentDepthParams(seg));
}

/** Kelas threshold sebuah displayed depth (dipakai re-color bar + badge). */
export function depthClass(displayed: number, t: Threshold): ThresholdClass {
  // threshold dibandingkan terhadap nilai absolut kedalaman (positif).
  return classifyThreshold(Math.abs(displayed), t);
}

export function depthColor(displayed: number, t: Threshold): string {
  return THRESHOLD_HEX[depthClass(displayed, t)];
}
