/**
 * API client slice `pengaturan` — threshold pengukuran (singleton `Pengukurans`).
 *
 * Threshold adalah satu-satunya data server yang dikelola halaman ini. Bentuk wire
 * mengikuti collection legacy `Pengukurans` (DOMAIN.md poin 5): field nested
 * `toleransi.{batasAwal,batasAkhir}`. Di FE kita pakai bentuk flat `Threshold`
 * (lulus/tidakLulus/batasAwal/batasAkhir) supaya enak buat slider+input → ada
 * mapper bolak-balik di sini.
 *
 * Reuse `apiClient` axios dari slice [auth] (interceptor 401→app-lock konsisten,
 * spec § C). JANGAN bikin instance baru.
 *
 * Endpoint kontrak (slice BE pengukuran, port existing): GET/PUT `/pengukuran`.
 * Slice BE belum tentu hidup saat ini → fetch menelan 404/Network dan
 * mengembalikan null (caller fallback ke DEFAULT_THRESHOLD), sama pola dgn slice
 * [dashboard]. Begitu endpoint nyala, data asli otomatis terpakai tanpa ubah UI.
 */
import axios from 'axios';
import { apiClient } from '../auth/api.js';
import type { Pengukuran, Threshold } from '../../shared/types.js';

/** Default threshold (DOMAIN.md poin 5) — dipakai saat server belum ada / offline. */
export const DEFAULT_THRESHOLD: Threshold = {
  lulus: 2.5,
  tidakLulus: 2.0,
  batasAwal: 2.0,
  batasAkhir: 2.5,
};

/** Bentuk legacy `Pengukurans` (nested) → bentuk flat `Threshold` UI. */
export function toThreshold(p: Pengukuran): Threshold {
  return {
    lulus: p.lulus,
    tidakLulus: p.tidakLulus,
    batasAwal: p.toleransi.batasAwal,
    batasAkhir: p.toleransi.batasAkhir,
  };
}

/** Bentuk flat `Threshold` UI → payload legacy `Pengukurans` (nested). */
export function toPengukuran(t: Threshold): Omit<Pengukuran, '_id'> {
  return {
    lulus: t.lulus,
    tidakLulus: t.tidakLulus,
    toleransi: { batasAwal: t.batasAwal, batasAkhir: t.batasAkhir },
  };
}

/**
 * Ambil threshold singleton dari server. null = belum ada / offline / endpoint
 * belum hidup (caller fallback ke DEFAULT_THRESHOLD).
 */
export async function fetchThreshold(): Promise<Threshold | null> {
  try {
    const { data } = await apiClient.get<Pengukuran>('/pengukuran');
    if (!data) return null;
    return toThreshold(data);
  } catch (err) {
    if (axios.isAxiosError(err)) return null;
    throw err;
  }
}

/**
 * Simpan threshold (admin-only di server via requireRole). Mengembalikan threshold
 * yang dipersist (echo) supaya cache bisa langsung diisi.
 */
export async function saveThreshold(t: Threshold): Promise<Threshold> {
  const { data } = await apiClient.put<Pengukuran>('/pengukuran', toPengukuran(t));
  // Server boleh echo dokumen tersimpan; kalau tidak, pakai nilai yang dikirim.
  return data ? toThreshold(data) : t;
}
