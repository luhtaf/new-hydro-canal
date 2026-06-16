/**
 * API client slice `qc` — export TXT/PNG/Excel/PAT/ZPM32 + bulk ZIP + list output.
 *
 * Export endpoint balas file binary → `responseType: 'blob'`, lalu di-download via
 * Blob (lihat `downloadBlob`). Reuse `apiClient` axios dari slice auth (withCredentials
 * + interceptor 401→app-lock) — JANGAN bikin instance baru.
 *
 * Kontrak format sinkron dgn BE `qc.service.ExportFormat` + `qc.routes`.
 */
import { apiClient } from '../auth/api.js';

/** Format export yang didukung (sinkron BE EXPORT_FORMATS). */
export type ExportFormat =
  | 'png'
  | 'txt'
  | 'page2-xlsx'
  | 'page3-xlsx'
  | 'pat-csv'
  | 'zpm32';

/** 1 kartu output untuk grid (sinkron BE QcOutputCard). */
export interface QcOutputCard {
  canalId: string;
  canalCode: string;
  orderNo: string;
  contractorShort: string;
  district: string;
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Done';
  qcOutput: string | null;
  requestType: 'QC' | 'RE-QC';
  mini: number[];
  summary: { pass: number; tol: number; fail: number; total: number };
}

/** Ambil nama file dari header Content-Disposition (fallback ke argumen). */
function filenameFromHeader(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback;
  const m = /filename="?([^"]+)"?/.exec(disposition);
  return m?.[1] ?? fallback;
}

/** Trigger download browser dari Blob (port demo `downloadBlob`). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/** List kartu output untuk grid QcProcessing. */
export async function listOutputs(): Promise<QcOutputCard[]> {
  const { data } = await apiClient.get<QcOutputCard[]>('/qc/outputs');
  return data;
}

/**
 * Export 1 format untuk 1 canal → langsung download. Return nama file yang ter-download.
 * `canalId` = Canal `_id`.
 */
export async function exportSingle(
  canalId: string,
  format: ExportFormat,
): Promise<string> {
  const res = await apiClient.post(`/qc/export/${format}/${canalId}`, null, {
    responseType: 'blob',
  });
  const filename = filenameFromHeader(
    res.headers['content-disposition'] as string | undefined,
    `${canalId}-${format}`,
  );
  downloadBlob(res.data as Blob, filename);
  return filename;
}

/** Export bulk (banyak canal × banyak format) → download ZIP. */
export async function exportBulk(
  canalIds: string[],
  formats: ExportFormat[],
): Promise<string> {
  const res = await apiClient.post(
    '/qc/export/bulk',
    { canalIds, formats },
    { responseType: 'blob' },
  );
  const filename = filenameFromHeader(
    res.headers['content-disposition'] as string | undefined,
    'qc-export.zip',
  );
  downloadBlob(res.data as Blob, filename);
  return filename;
}
