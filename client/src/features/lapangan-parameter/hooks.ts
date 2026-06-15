/**
 * hooks.ts — jembatan PouchDB untuk form Parameter (FE-only, local-first).
 *
 * SATU JALUR BACA: `usePouchDoc` (shared/db) untuk subscribe live.
 * SATU JALUR TULIS: `writeDoc` (shared/db/sync) → masuk outbox → diserap [sync].
 * JANGAN `getPouch().put` langsung (bypass outbox = data hilang).
 */
import { useCallback } from 'react';
import { usePouchDoc } from '../../shared/db/usePouchDoc.js';
import { writeDoc } from '../../shared/db/sync.js';
import { useAuthStore } from '../auth/store.js';
import type { SyncDoc } from '../../shared/types.js';

/** id doc PouchDB. */
export const canalDocId = (canalId: string) => `canal:${canalId}`;
export const parameterDocId = (canalId: string) => `parameter:${canalId}`;

/**
 * Assignment kanal (doc `canal:<canalId>`) — sumber auto-fill form. Berisi field
 * Excel AOI + assigning (subset `Canal` di shared/types). FE-only: kalau belum
 * ter-seed, kembalikan null → form fallback ke draft / kosong.
 */
export interface AssignmentPayload {
  canalId: string;
  orderNo: string;
  district: string;
  contractor: string;
  measurePoint: string;
  panjang: number;
  dimensi: string;
  coordX: number;
  coordY: number;
  finishDate: string; // acuan clamp Measure Date (DOMAIN.md poin 3)
  startDate?: string;
  requestType?: 'QC' | 'RE-QC';
  districtCode?: string; // untuk preview filename (DOMAIN.md poin 7)
}

export function useAssignment(canalId: string): SyncDoc<AssignmentPayload> | null {
  return usePouchDoc<AssignmentPayload>(canalDocId(canalId));
}

/** Payload draft parameter yang ditulis offline (cikal-bakal CanalDataSegment). */
export interface ParameterDraftPayload {
  canalId: string;
  orderNo: string;
  operationNo: string;
  district: string;
  contractor: string;
  measurePoint: string;
  startSta: number;
  endSta: number;
  panjang: number;
  dimensi: string;
  coordX: number;
  coordY: number;
  waterLevel: string;
  tranducer: string;
  bedFloat: string;
  depthCorrection: string;
  qcType: 'QC' | 'RE-QC';
  revision: string;
  qcDate: string;
  measureDate: string;
}

export function useParameterDraft(
  canalId: string,
): SyncDoc<ParameterDraftPayload> | null {
  return usePouchDoc<ParameterDraftPayload>(parameterDocId(canalId));
}

/**
 * Simpan draft parameter ke PouchDB (lewat sync engine). Mempertahankan
 * `serverBase`/`_rev` doc lama supaya conflict detection [sync] tetap jalan.
 */
export function useSaveParameter(canalId: string) {
  const userId = useAuthStore((s) => s.activeUserId);
  const existing = useParameterDraft(canalId);

  return useCallback(
    async (payload: ParameterDraftPayload) => {
      if (!userId) throw new Error('Tidak ada akun aktif');
      const doc: SyncDoc<ParameterDraftPayload> = {
        _id: parameterDocId(canalId),
        ...(existing?._rev ? { _rev: existing._rev } : {}),
        type: 'parameter',
        payload,
        serverBase: existing?.serverBase ?? null,
        updatedAt: new Date().toISOString(),
      };
      await writeDoc(userId, doc as unknown as SyncDoc);
    },
    [userId, canalId, existing],
  );
}
