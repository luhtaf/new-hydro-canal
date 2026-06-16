/**
 * useThreshold — sumber threshold untuk chart kedalaman.
 *
 * SEMENTARA: slice `pengukuran` (singleton Pengukurans + admin edit) belum ada.
 * Hook ini mengembalikan default DOMAIN.md poin 5, dan saat slice pengukuran siap
 * tinggal ganti isinya jadi `useQuery(['pengukuran'])` / mirror PouchDB — konsumen
 * (ChartData/ChartDetailData/ChartPreview) tidak perlu berubah.
 *
 * Default (DOMAIN.md poin 5): lulus 2.5, tidakLulus 2.0, toleransi 2.0–2.5.
 */
import type { Threshold } from '../../shared/types.js';

export const DEFAULT_THRESHOLD: Threshold = {
  lulus: 2.5,
  tidakLulus: 2.0,
  batasAwal: 2.0,
  batasAkhir: 2.5,
};

export function useThreshold(): { threshold: Threshold; isLoading: boolean } {
  // TODO(pengukuran-slice): ganti ke useQuery(['pengukuran']) + fallback offline PouchDB.
  return { threshold: DEFAULT_THRESHOLD, isLoading: false };
}
