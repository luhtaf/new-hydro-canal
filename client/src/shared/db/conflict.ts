/**
 * conflict.ts — deteksi & resolusi konflik sync (spec § D "Konflik resolution").
 *
 * Konflik = doc yang sama diedit di 2 tempat. Server menolak push kalau
 * `serverBase` lokal != `updatedAt` versi server → balas PushResult dengan
 * `{ ok:false, conflict:{ lokal, server } }`. Item itu kita simpan jadi
 * ConflictItem dan tampilkan di /konflik.
 *
 * Strategi default per-type (spec § D):
 * - parameter  → LWW (last-write-wins by updatedAt)
 * - depth      → manual (drag-edit sering kolisi → minta operator pilih)
 * - canal/meta → server-wins (admin-field: status/assignedTo/threshold)
 *
 * Penyimpanan: konflik adalah state UI sesi (bukan data domain), disimpan di
 * Map in-memory + listener. Tidak masuk PouchDB supaya tidak ikut sync ulang.
 * (Outbox tetap menahan versi lokal sampai konflik diselesaikan.)
 */
import type { ConflictItem, SyncDoc, SyncDocType, PushResult } from '../types.js';

/** Strategi default per type doc. */
export function defaultStrategy(type: SyncDocType): ConflictItem['strategy'] {
  switch (type) {
    case 'parameter':
      return 'lww';
    case 'depth':
      return 'manual';
    case 'canal':
    case 'meta':
      return 'server-wins';
  }
}

/** Bangun ConflictItem dari hasil push yang ditolak. */
export function toConflictItem(
  lokal: SyncDoc,
  server: SyncDoc,
): ConflictItem {
  return {
    docId: lokal._id,
    type: lokal.type,
    lokal,
    server,
    strategy: defaultStrategy(lokal.type),
    detectedAt: new Date().toISOString(),
  };
}

/** Ambil semua konflik dari batch PushResult (yang `ok:false`). */
export function extractConflicts(results: PushResult[]): ConflictItem[] {
  const out: ConflictItem[] = [];
  for (const r of results) {
    if (!r.ok) out.push(toConflictItem(r.conflict.lokal, r.conflict.server));
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolusi
// ─────────────────────────────────────────────────────────────────────────────

/** Pilihan resolusi untuk konflik single-field (kedalaman). */
export type Side = 'lokal' | 'server';

/**
 * Resolusi single-field: ambil seluruh payload dari sisi yang dipilih.
 * Hasil = doc yang siap di-tulis ulang ke Pouch dengan `serverBase` = updatedAt
 * server (supaya push berikutnya tidak bentrok lagi).
 */
export function resolveSingle(c: ConflictItem, pick: Side): SyncDoc {
  const chosen = pick === 'lokal' ? c.lokal : c.server;
  return {
    ...chosen,
    serverBase: c.server.updatedAt,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Resolusi multi-field (parameter): merge per-field sesuai pilihan dropdown.
 * `picks` = map fieldName → side. Field yang tidak ada di map ambil lokal.
 */
export function resolveMulti(
  c: ConflictItem,
  picks: Record<string, Side>,
): SyncDoc {
  const lokalP = c.lokal.payload as Record<string, unknown>;
  const serverP = c.server.payload as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...lokalP };
  for (const [field, side] of Object.entries(picks)) {
    merged[field] = side === 'server' ? serverP[field] : lokalP[field];
  }
  return {
    ...c.lokal,
    payload: merged,
    serverBase: c.server.updatedAt,
    updatedAt: new Date().toISOString(),
  };
}

/** Auto-resolve sesuai strategi default (dipakai kalau setting auto aktif). */
export function autoResolve(c: ConflictItem): SyncDoc {
  switch (c.strategy) {
    case 'lww':
      // last-write-wins: bandingkan updatedAt.
      return resolveSingle(c, c.lokal.updatedAt >= c.server.updatedAt ? 'lokal' : 'server');
    case 'server-wins':
      return resolveSingle(c, 'server');
    case 'manual':
      // manual tidak boleh auto — caller harus pilih. Default ambil server biar aman.
      return resolveSingle(c, 'server');
  }
}

/**
 * Diff per-field antara lokal & server untuk render tabel multi-field.
 * `same:true` → field identik (ditampilkan abu-abu "sama").
 */
export interface FieldDiff {
  field: string;
  lokal: unknown;
  server: unknown;
  same: boolean;
}

export function diffFields(c: ConflictItem): FieldDiff[] {
  const lokalP = c.lokal.payload as Record<string, unknown>;
  const serverP = c.server.payload as Record<string, unknown>;
  const keys = new Set([...Object.keys(lokalP), ...Object.keys(serverP)]);
  return [...keys].map((field) => {
    const l = lokalP[field];
    const s = serverP[field];
    return { field, lokal: l, server: s, same: JSON.stringify(l) === JSON.stringify(s) };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Store konflik in-memory (sesi) + pub/sub
// ─────────────────────────────────────────────────────────────────────────────

type Listener = (items: ConflictItem[]) => void;

const conflicts = new Map<string, ConflictItem>(); // keyed by docId
const listeners = new Set<Listener>();

function emit() {
  const snapshot = list();
  for (const l of listeners) l(snapshot);
}

/** Daftar konflik aktif (urut waktu terdeteksi). */
export function list(): ConflictItem[] {
  return [...conflicts.values()].sort((a, b) =>
    a.detectedAt.localeCompare(b.detectedAt),
  );
}

/** Tambah konflik (dipanggil sync engine saat push ditolak). */
export function add(item: ConflictItem): void {
  conflicts.set(item.docId, item);
  emit();
}

/** Tambah banyak sekaligus. */
export function addMany(items: ConflictItem[]): void {
  if (items.length === 0) return;
  for (const i of items) conflicts.set(i.docId, i);
  emit();
}

/** Hapus konflik (setelah diselesaikan). */
export function remove(docId: string): void {
  if (conflicts.delete(docId)) emit();
}

/** Subscribe perubahan daftar konflik. Return unsubscribe. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Jumlah konflik aktif (untuk badge sidebar). */
export function count(): number {
  return conflicts.size;
}
