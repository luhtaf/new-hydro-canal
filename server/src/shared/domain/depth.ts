/**
 * Final depth (DOMAIN.md poin 4) — WAJIB sinkron FE & BE.
 * Formula: (depth + water_level + tranducer + bed_float - depth_correction) * -1
 *
 * Sinkron persis dgn client/src/shared/domain/depth.ts.
 */
import type { DepthParams } from '../types.js';

/** Offset = WL + tranducer + bed_float - depth_correction (bagian non-depth dari formula). */
function offset(p: Omit<DepthParams, 'depth'>): number {
  return p.water_level + p.tranducer + p.bed_float - p.depth_correction;
}

/** Hitung displayed depth (sudah * -1 untuk flip ke bawah di grafik). */
export function finalDepth(p: DepthParams): number {
  return (p.depth + offset(p)) * -1;
}

/**
 * Reverse formula untuk drag-edit chart:
 *   raw_depth = displayed * -1 - (WL + tranducer + bed_float - correction)
 *
 * Catatan: `displayed` adalah nilai hasil finalDepth (sudah ter-flip). Untuk balik ke
 * raw depth kita flip lagi (`* -1`) lalu kurangi offset.
 */
export function reverseDepth(
  displayed: number,
  p: Omit<DepthParams, 'depth'>,
): number {
  return displayed * -1 - offset(p);
}
