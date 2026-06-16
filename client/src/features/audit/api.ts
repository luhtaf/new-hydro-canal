/**
 * API client slice `audit` — read-only, admin-only (PLAN-BE "Audit — admin only").
 *
 * Online = session cookie. Reuse axios instance dari slice auth (interceptor
 * 401→app-lock konsisten). JANGAN bikin instance baru.
 *
 * Endpoint:
 *   GET /audit?userId&action&from&to&q&page&limit  → halaman terfilter
 *   GET /audit/recent?limit=5                       → feed dashboard
 */
import { apiClient } from '../auth/api.js';
import type { AuditAction, AuditLog } from '../../shared/types.js';

/** Filter yang dikirim ke server (semua opsional). */
export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  /** ISO atau YYYY-MM-DD. */
  from?: string;
  to?: string;
  /** pencarian teks bebas (userName/kind/target/detail). */
  q?: string;
}

/** Response GET /audit (page-based, untuk infinite scroll). */
export interface AuditPage {
  items: AuditLog[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/** Buang key kosong supaya querystring rapi. */
function clean(params: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v as string | number;
  }
  return out;
}

/** GET /audit — 1 halaman terfilter. */
export async function fetchAudit(
  filter: AuditFilter,
  page: number,
  limit = 25,
): Promise<AuditPage> {
  const { data } = await apiClient.get<AuditPage>('/audit', {
    params: clean({ ...filter, page, limit }),
  });
  return data;
}

/** GET /audit/recent — N terbaru (activity feed dashboard). */
export async function fetchRecentAudit(limit = 5): Promise<AuditLog[]> {
  const { data } = await apiClient.get<AuditLog[]>('/audit/recent', {
    params: { limit },
  });
  return data;
}
