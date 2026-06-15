/**
 * API client slice `undangan` — AOI ingestion + query Aoi/Canal (PLAN-BE.md).
 * Reuse `apiClient` axios dari slice auth (withCredentials + interceptor 401).
 *
 * Endpoint:
 *   POST /aoi/import        (multipart xlsx, admin)
 *   GET  /aois              list AOI header
 *   GET  /aois/:id          AOI + canals
 *   GET  /canals            filter status/district/contractor/q
 *   GET  /canals/:orderNo   canal + siblings (kontraktor/distrik sama)
 */
import { apiClient } from '../auth/api.js';
import type { Aoi, Canal, CanalStatus, Id } from '../../shared/types.js';

export interface ImportResult {
  aoiId: string;
  canalCount: number;
  errors: Array<{ row: number; orderNo?: string; reasons: string[] }>;
  duplicates: string[];
}

export interface CanalFilter {
  status?: CanalStatus;
  district?: string;
  contractor?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CanalListResponse {
  data: Canal[];
  total: number;
}

export interface AoiListResponse {
  data: Aoi[];
  total: number;
}

export interface AoiDetail {
  aoi: Aoi;
  canals: Canal[];
}

export interface CanalDetail {
  canal: Canal;
  siblings: Canal[];
  aoi: Aoi | null;
}

/** Import Excel AOI (admin). Kirim sebagai multipart (field "file"). */
export async function importAoi(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ImportResult>('/aoi/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listAois(page = 1, limit = 20): Promise<AoiListResponse> {
  const { data } = await apiClient.get<AoiListResponse>('/aois', { params: { page, limit } });
  return data;
}

export async function getAoi(id: Id): Promise<AoiDetail> {
  const { data } = await apiClient.get<AoiDetail>(`/aois/${id}`);
  return data;
}

export async function listCanals(filter: CanalFilter = {}): Promise<CanalListResponse> {
  const { data } = await apiClient.get<CanalListResponse>('/canals', { params: filter });
  return data;
}

export async function getCanal(orderNo: string): Promise<CanalDetail> {
  const { data } = await apiClient.get<CanalDetail>(`/canals/${orderNo}`);
  return data;
}
