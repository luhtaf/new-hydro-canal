/**
 * API client slice `dashboard` — agregasi ringan untuk home (`/`).
 *
 * Dashboard adalah konsumen read-only: KPI + feed. Sumber datanya campuran:
 *   - `/audit/recent` → live activity feed (slice [audit] BE; belum tentu sudah hidup
 *     saat dashboard dirilis → fallback graceful, lihat catatan di bawah).
 *   - endpoint existing port (`/alldatas`) → derive KPI undangan/penugasan/QC pass rate.
 *   - antrian sync = outbox PouchDB lokal (BUKAN network) → di-hook terpisah
 *     (`useSyncQueue` slice [konflik]); dashboard tidak fetch-nya dari API.
 *
 * Reuse axios instance dari slice [auth] supaya interceptor 401→app-lock konsisten
 * (spec § C). JANGAN bikin instance baru.
 *
 * Catatan kontrak `/audit/recent`: slice [audit] BE belum tentu ada saat slice ini
 * mendarat. Supaya home tidak crash, `fetchRecentAudit` menelan 404/Network dan
 * mengembalikan array kosong → komponen feed menampilkan empty-state, bukan error.
 * Begitu endpoint hidup, feed otomatis terisi tanpa ubah komponen.
 */
import axios from 'axios';
import { apiClient } from '../auth/api.js';
import type { AuditLog, Data } from '../../shared/types.js';

/** Item feed yang dipakai LiveActivity (subset AuditLog + warna avatar turunan). */
export type ActivityItem = AuditLog;

/**
 * Ambil audit terbaru (live activity feed). Polling 30s di hook.
 * Endpoint kontrak: GET /audit/recent?limit=N → AuditLog[] (terbaru dulu).
 * 404 / offline → [] (graceful; lihat catatan modul).
 */
export async function fetchRecentAudit(limit = 8): Promise<ActivityItem[]> {
  try {
    const { data } = await apiClient.get<ActivityItem[]>('/audit/recent', {
      params: { limit },
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // Endpoint belum hidup (audit slice BE belum mendarat) atau offline:
    // jangan jatuhkan dashboard — feed cukup tampil empty.
    if (axios.isAxiosError(err)) return [];
    throw err;
  }
}

/**
 * Ambil semua MainData (port `/alldatas`) untuk derive KPI + status QC terbaru.
 * Dashboard tidak punya endpoint agregasi sendiri (YAGNI) → derive di klien dari
 * list yang sudah ada. Kalau nanti volume besar, ganti ke endpoint `/dashboard/kpi`.
 */
export async function fetchDashboardData(): Promise<Data[]> {
  try {
    const { data } = await apiClient.get<Data[]>('/alldatas');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (axios.isAxiosError(err)) return [];
    throw err;
  }
}
