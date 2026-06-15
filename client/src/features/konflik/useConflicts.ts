/**
 * useConflicts — bridge React ⇄ store konflik in-memory (shared/db/conflict.ts).
 *
 * Konflik bukan server-state (TanStack) & bukan data offline (PouchDB) — ia
 * state sesi yang diisi sync engine saat push ditolak. Hook ini subscribe ke
 * pub/sub conflict.ts via useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react';
import { list, count, subscribe } from '../../shared/db/conflict.js';
import type { ConflictItem } from '../../shared/types.js';

/** Daftar konflik aktif (re-render saat berubah). */
export function useConflicts(): ConflictItem[] {
  return useSyncExternalStore(subscribe, list, list);
}

/** Jumlah konflik (untuk badge sidebar "Konflik sync N"). */
export function useConflictCount(): number {
  return useSyncExternalStore(subscribe, count, count);
}
