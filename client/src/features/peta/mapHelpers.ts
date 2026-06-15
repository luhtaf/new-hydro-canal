/**
 * Helper murni untuk peta Leaflet — terpisah dari komponen supaya bisa diuji &
 * di-reuse. TIDAK impor Leaflet di sini (biar tetap pure / SSR-safe).
 */
import type { CanalStatus } from '../../shared/types.js';
import { THRESHOLD_HEX } from '../../shared/domain/threshold.js';
import type { ThresholdClass } from '../../shared/types.js';
import type { PetaCanal } from './canals.js';

/** Filter aktif di toolbar peta (port demo: Semua / Aktif / Selesai). */
export type PetaFilter = 'semua' | 'aktif' | 'selesai';

/** Warna pin per status canal (selaras palet brand demo). */
export const STATUS_PIN: Record<CanalStatus, { color: string; label: string }> = {
  Submitted: { color: '#94a3b8', label: 'Belum ditugaskan' }, // slate-400
  Assigned: { color: '#0284c7', label: 'Ditugaskan' }, // brand-600
  'In Progress': { color: '#f59e0b', label: 'Sedang diukur' }, // amber-500
  Done: { color: '#10b981', label: 'Selesai' }, // emerald-500
};

/** Apakah canal lolos filter aktif. "aktif" = belum Done, "selesai" = Done. */
export function matchFilter(status: CanalStatus, filter: PetaFilter): boolean {
  if (filter === 'semua') return true;
  if (filter === 'selesai') return status === 'Done';
  return status !== 'Done';
}

/** Hitung jumlah per kategori filter (untuk badge count toolbar). */
export function filterCounts(canals: PetaCanal[]): Record<PetaFilter, number> {
  return canals.reduce<Record<PetaFilter, number>>(
    (acc, c) => {
      acc.semua += 1;
      if (c.status === 'Done') acc.selesai += 1;
      else acc.aktif += 1;
      return acc;
    },
    { semua: 0, aktif: 0, selesai: 0 },
  );
}

/**
 * Sample titik STA color-coded di sekitar 1 kanal aktif (port demo renderMap).
 * Deterministik (seed dari canalId) supaya tidak "loncat" tiap re-render —
 * beda dgn demo yang pakai Math.random.
 */
export interface StaSample {
  sta: number;
  offsetLat: number;
  offsetLng: number;
  cls: ThresholdClass;
  color: string;
}

const STA_CLASSES: ThresholdClass[] = ['pass', 'pass', 'pass', 'tolerance', 'pass', 'fail'];

/** Pseudo-random deterministik kecil (mulberry-ish) dari string seed. */
function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function sampleSta(canalId: string, count = 12): StaSample[] {
  let seed = seedFromString(canalId);
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const out: StaSample[] = [];
  for (let i = 0; i < count; i++) {
    const cls = STA_CLASSES[Math.floor(next() * STA_CLASSES.length)] ?? 'pass';
    out.push({
      sta: 500 + i * 20,
      offsetLat: (next() - 0.5) * 0.012,
      offsetLng: (i - count / 2) * 0.002,
      cls,
      color: THRESHOLD_HEX[cls],
    });
  }
  return out;
}
