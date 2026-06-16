/**
 * API client slice `data` — PORT endpoint existing (fullstack-hydrocanal-graph
 * `routes/data.ts`). Polymorphic `:id` pattern dipertahankan (DOMAIN/CLAUDE existing):
 * satu `:id` bisa menunjuk MainData (Data root), canal_data segment, atau depth point —
 * server yang resolve. Slice ini cuma membungkus transport.
 *
 * Online = session cookie (withCredentials). Reuse axios instance dari slice auth
 * supaya interceptor 401→app-lock konsisten (spec § C). JANGAN bikin instance baru.
 *
 * Hierarki data (legacy nested, types.ts):
 *   Data (MainData root, batang_canal_id)
 *     └─ canal_data[] (CanalDataSegment, 1 segmen kanal)
 *          └─ data[] (DepthPoint, 1 titik STA)
 */
import { apiClient } from '../auth/api.js';
import type {
  Data,
  CanalDataSegment,
  DepthPoint,
  Id,
} from '../../shared/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// MainData (Data root) — /datas
// ─────────────────────────────────────────────────────────────────────────────

/** List semua MainData (admin). Port GET /alldatas. */
export async function listMainData(): Promise<Data[]> {
  const { data } = await apiClient.get<Data[]>('/alldatas');
  return data;
}

/** Detail 1 MainData. Port GET /datas/:id. */
export async function getMainData(id: Id): Promise<Data> {
  const { data } = await apiClient.get<Data>(`/datas/${id}`);
  return data;
}

/** Buat MainData baru. Port POST /datas. */
export async function createMainData(
  body: Pick<Data, 'batang_canal_id'> & Partial<Data>,
): Promise<Data> {
  const { data } = await apiClient.post<Data>('/datas', body);
  return data;
}

/** Update MainData. Port PATCH /datas/:id. */
export async function updateMainData(
  id: Id,
  patch: Partial<Data>,
): Promise<Data> {
  const { data } = await apiClient.patch<Data>(`/datas/${id}`, patch);
  return data;
}

/** Hapus MainData. Port DELETE /datas/:id. */
export async function deleteMainData(id: Id): Promise<void> {
  await apiClient.delete(`/datas/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Data / canal_data segment — /data/:id
// ─────────────────────────────────────────────────────────────────────────────

/** Ambil 1 canal_data segment. Port GET /data/:id. */
export async function getSegment(id: Id): Promise<CanalDataSegment> {
  const { data } = await apiClient.get<CanalDataSegment>(`/data/${id}`);
  return data;
}

/**
 * Tambah canal_data segment ke MainData. Port POST /data/:id.
 * `:id` = MainData id (parent yang dipush).
 */
export async function addSegment(
  mainDataId: Id,
  body: Partial<CanalDataSegment> | Partial<CanalDataSegment>[],
): Promise<Data> {
  const { data } = await apiClient.post<Data>(`/data/${mainDataId}`, body);
  return data;
}

/** Update canal_data segment. Port PATCH /data/:id. */
export async function updateSegment(
  id: Id,
  patch: Partial<CanalDataSegment>,
): Promise<CanalDataSegment> {
  const { data } = await apiClient.patch<CanalDataSegment>(`/data/${id}`, patch);
  return data;
}

/** Hapus 1 canal_data segment. Port DELETE /data/:id. */
export async function deleteSegment(id: Id): Promise<void> {
  await apiClient.delete(`/data/${id}`);
}

/** Hapus semua segment di 1 MainData. Port DELETE /alldata/:id. */
export async function deleteAllSegments(mainDataId: Id): Promise<void> {
  await apiClient.delete(`/alldata/${mainDataId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DetailData / depth point — /detaildata/:id
// ─────────────────────────────────────────────────────────────────────────────

/** Detail 1 depth point. Port GET /detaildata/:id. */
export async function getDetail(id: Id): Promise<DepthPoint> {
  const { data } = await apiClient.get<DepthPoint>(`/detaildata/${id}`);
  return data;
}

/**
 * Tambah depth point(s) ke segment. Port POST /detaildata/:id.
 * `:id` = canal_data segment id. Body bisa 1 titik atau array (bulk Excel page 3).
 */
export async function addDetail(
  segmentId: Id,
  body: Partial<DepthPoint> | Partial<DepthPoint>[],
): Promise<CanalDataSegment> {
  const { data } = await apiClient.post<CanalDataSegment>(
    `/detaildata/${segmentId}`,
    body,
  );
  return data;
}

/** Update depth point. Port PATCH /detaildata/:id. */
export async function updateDetail(
  id: Id,
  patch: Partial<DepthPoint>,
): Promise<DepthPoint> {
  const { data } = await apiClient.patch<DepthPoint>(`/detaildata/${id}`, patch);
  return data;
}

/** Hapus 1 depth point. Port DELETE /detaildata/:id. */
export async function deleteDetail(id: Id): Promise<void> {
  await apiClient.delete(`/detaildata/${id}`);
}

/** Hapus semua depth point di segment. Port DELETE /alldetaildata/:id. */
export async function deleteAllDetails(segmentId: Id): Promise<void> {
  await apiClient.delete(`/alldetaildata/${segmentId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart / drag-save — /datachart/:id, /updatechartdata/:id, /exportallchart/:id
// ─────────────────────────────────────────────────────────────────────────────

/** Payload chart per segment (port GET /datachart/:id). */
export interface ChartPayload {
  segment: CanalDataSegment;
  points: DepthPoint[];
}

/** Ambil data chart untuk 1 segment. Port GET /datachart/:id. */
export async function getSegmentChart(id: Id): Promise<ChartPayload> {
  const { data } = await apiClient.get<ChartPayload>(`/datachart/${id}`);
  return data;
}

/** Body simpan hasil drag chart (1 titik). */
export interface DragSaveBody {
  /** id depth point (atau STA jika server resolve by sta). */
  pointId: Id;
  /** raw_depth hasil reverse formula (BUKAN displayed). */
  depth: number;
}

/**
 * Simpan hasil drag-edit chart. Port PATCH /updatechartdata/:id.
 * `:id` = segment id; body berisi titik yang diubah (raw depth, sudah di-reverse di FE).
 */
export async function saveDragEdit(
  segmentId: Id,
  body: DragSaveBody,
): Promise<{ ok: boolean }> {
  const { data } = await apiClient.patch<{ ok: boolean }>(
    `/updatechartdata/${segmentId}`,
    body,
  );
  return data;
}

/**
 * Export semua chart PNG (server-side chartjs-node-canvas). Port POST /exportallchart/:id.
 * `:id` = MainData id. Return Blob ZIP/PNG untuk di-download.
 */
export async function exportAllChart(mainDataId: Id): Promise<Blob> {
  const { data } = await apiClient.post(
    `/exportallchart/${mainDataId}`,
    {},
    { responseType: 'blob' },
  );
  return data as Blob;
}
