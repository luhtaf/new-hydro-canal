/**
 * API client slice `penugasan`. Reuse `apiClient` axios dari slice auth (withCredentials,
 * interceptor 401 → app-lock). JANGAN bikin instance baru.
 *
 * Endpoint (PLAN-BE.md "Penugasan" + "Canals"):
 *   GET  /penugasan/mine?tab   — grouped Kontraktor → Distrik (server hitung deadline/chip)
 *   GET  /penugasan/:canalId   — detail 1 canal + progress (canalId = Canal.orderNo)
 *   POST /canals/assign        — bulk assign (admin)
 *   POST /canals/unassign      — bulk unassign (admin)
 *
 * Bentuk respons SINKRON dgn server (`penugasan.service.ts`): tone/label deadline
 * dihitung server supaya FE tidak duplikasi logika (tetap reuse shared/domain di FE
 * untuk hal lain seperti mini-map UTM).
 */
import { apiClient } from '../auth/api.js';
import type { CanalStatus, Tone, UsvCode } from '../../shared/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Bentuk respons (mirror server PenugasanCanal/Contractor/Detail)
// ─────────────────────────────────────────────────────────────────────────────

export interface DeadlineChip {
  daysLeft: number;
  label: string;
  tone: Tone;
}

export interface PenugasanCanal {
  orderNo: string;
  canalId: string;
  district: string;
  contractor: string;
  panjang: number;
  dimensi: string;
  measurePoint: string;
  coordX: number;
  coordY: number;
  requestDate: string;
  startDate: string;
  finishDate: string;
  requestType: string;
  status: CanalStatus;
  usv: UsvCode | null;
  qcOutput: string | null;
  deadline: DeadlineChip;
}

export interface PenugasanDistrict {
  district: string;
  totalMeter: number;
  canals: PenugasanCanal[];
}

export interface PenugasanContractor {
  contractor: string;
  shortName: string;
  summary: {
    canalCount: number;
    districtCount: number;
    totalMeter: number;
    nearest: DeadlineChip;
  };
  districts: PenugasanDistrict[];
}

export type PenugasanTab = 'aktif' | 'selesai';

export interface MinePenugasan {
  tab: PenugasanTab;
  total: number;
  groups: PenugasanContractor[];
}

export interface PenugasanDetail {
  canal: PenugasanCanal & {
    aoiId: string;
    assignedTo: string | null;
    assignedAt: string | null;
    dataId: string | null;
  };
  progress: {
    hasParameter: boolean;
    depthPoints: number;
    hasOutput: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calls
// ─────────────────────────────────────────────────────────────────────────────

/** Penugasan saya (grouped). Scope user dari sesi (server pakai cookie). */
export async function getMine(tab: PenugasanTab): Promise<MinePenugasan> {
  const { data } = await apiClient.get<MinePenugasan>('/penugasan/mine', {
    params: { tab },
  });
  return data;
}

/** Detail 1 penugasan (canalId = Canal.orderNo). */
export async function getPenugasanDetail(canalId: string): Promise<PenugasanDetail> {
  const { data } = await apiClient.get<PenugasanDetail>(`/penugasan/${canalId}`);
  return data;
}

export interface AssignBody {
  orderNos: string[];
  assignedTo: string;
  usv: UsvCode;
}

/** Bulk assign (admin). Submitted → Assigned. */
export async function assignCanals(
  body: AssignBody,
): Promise<{ updated: number; assignedTo: string; usv: UsvCode }> {
  const { data } = await apiClient.post('/canals/assign', body);
  return data as { updated: number; assignedTo: string; usv: UsvCode };
}

/** Bulk unassign (admin). Assigned → Submitted. */
export async function unassignCanals(orderNos: string[]): Promise<{ updated: number }> {
  const { data } = await apiClient.post('/canals/unassign', { orderNos });
  return data as { updated: number };
}
