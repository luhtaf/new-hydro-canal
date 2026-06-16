/**
 * depthMath — helper murni untuk doc kedalaman lapangan. TANPA dependensi PouchDB/
 * sync, supaya bisa di-unit-test di node env (lihat depthDoc.test.ts).
 *
 * Formula final depth + threshold DIDELEGASIKAN ke shared/domain (JANGAN duplikat
 * supaya sinkron FE↔BE — DOMAIN.md poin 4/5).
 */
import { finalDepth, reverseDepth } from '../../shared/domain/depth.js';
import { classifyThreshold } from '../../shared/domain/threshold.js';
import type {
  DepthParams,
  Threshold,
  ThresholdClass,
} from '../../shared/types.js';

/** Prefix id doc kedalaman di PouchDB (spec: `depth:<canalId>:<sta>`). */
export const DEPTH_PREFIX = 'depth:';

/** Payload tersimpan di SyncDoc type='depth'. Field flat (spec § D). */
export interface DepthPayload {
  canalId: string;
  sta: number;
  /** raw depth (sebelum formula flip) — sumber kebenaran. */
  depth: number;
  lattitude: number; // sic — ejaan legacy dipertahankan agar kompat data lama
  longitude: number;
  /** Measure Date (tanggal pengukuran, ISO). */
  measureDate: string;
  /** Parameter non-depth formula (DOMAIN.md poin 4). */
  water_level: number;
  tranducer: number; // sic — ejaan legacy
  bed_float: number;
  depth_correction: number;
}

/** id PouchDB untuk 1 titik. */
export function depthDocId(canalId: string, sta: number): string {
  return `${DEPTH_PREFIX}${canalId}:${sta}`;
}

/** Parameter non-depth dari payload (untuk finalDepth/reverseDepth). */
export function payloadParams(p: DepthPayload): Omit<DepthParams, 'depth'> {
  return {
    water_level: p.water_level,
    tranducer: p.tranducer,
    bed_float: p.bed_float,
    depth_correction: p.depth_correction,
  };
}

/** Displayed depth (ter-flip * -1) untuk 1 payload. */
export function displayedOf(p: DepthPayload): number {
  return finalDepth({ depth: p.depth, ...payloadParams(p) });
}

/** raw depth dari displayed hasil drag (reverse formula). */
export function rawDepthFromFinal(displayed: number, p: DepthPayload): number {
  return reverseDepth(displayed, payloadParams(p));
}

/** Kelas threshold berdasarkan displayed depth (dibandingkan nilai absolut). */
export function statusOf(p: DepthPayload, t: Threshold): ThresholdClass {
  return classifyThreshold(Math.abs(displayedOf(p)), t);
}
