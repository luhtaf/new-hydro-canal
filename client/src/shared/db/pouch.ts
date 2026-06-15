/**
 * pouch.ts — instance PouchDB **per akun** + index pouchdb-find.
 *
 * Acuan: spec § C "Tiap akun = PouchDB namespace sendiri (`hydrocanal-<userId>`)"
 * + spec § D "doc kecil flat + projection".
 *
 * Prinsip:
 * - 1 DB per userId. Switch akun → ganti instance (akun lain TIDAK ikut kebaca).
 * - DB di-cache per userId supaya `getPouch()` idempotent (1 koneksi IndexedDB
 *   per akun, bukan buka-tutup tiap call).
 * - Index dibuat sekali per DB (lazy, di-await saat pertama kali dibutuhkan).
 *
 * SATU JALUR TULIS (spec § D): UI hanya baca/tulis ke DB di sini. Sync engine
 * (sync.ts) yang memindahkan PouchDB ⇄ server di belakang layar.
 */
import PouchDB from 'pouchdb-browser';
import PouchFind from 'pouchdb-find';
import type { SyncDoc, SyncDocType, OutboxOp } from '../types.js';

PouchDB.plugin(PouchFind);

/** Prefix namespace DB per-akun. */
const DB_PREFIX = 'hydrocanal-';

/** Prefix id outbox (op durable) supaya kepisah dari doc data. */
export const OUTBOX_PREFIX = '_outbox:';
/** Id doc meta sync (lastSeq pull, dll) — 1 per DB. */
export const SYNC_META_ID = '_local/sync-meta';

/** Bentuk doc meta sync (disimpan di `_local/` → tidak ikut replikasi/conflict). */
export interface SyncMeta {
  _id: typeof SYNC_META_ID;
  _rev?: string;
  /** seq terakhir dari GET /sync/pull (untuk pull inkremental). */
  lastSeq: string | null;
  /** ISO push sukses terakhir. */
  lastSyncedAt: string | null;
}

/** Doc data domain (SyncDoc) ATAU op outbox — keduanya tinggal di DB yang sama. */
export type StoredDoc = SyncDoc | OutboxOpDoc;

/** OutboxOp dibungkus jadi doc PouchDB (butuh _id/_rev sendiri). */
export interface OutboxOpDoc extends OutboxOp {
  _id: string; // OUTBOX_PREFIX + opId
  _rev?: string;
}

type DB = PouchDB.Database<Record<string, unknown>>;

// Cache instance + janji index per userId.
const instances = new Map<string, DB>();
const indexReady = new Map<string, Promise<void>>();

/** Nama DB IndexedDB untuk userId. */
export function dbName(userId: string): string {
  return `${DB_PREFIX}${userId}`;
}

/**
 * Ambil (atau buat) instance PouchDB untuk akun. Caller WAJIB pastikan userId
 * = akun aktif (lihat resolveActiveUserId di sync.ts).
 */
export function getPouch(userId: string): DB {
  let db = instances.get(userId);
  if (!db) {
    db = new PouchDB(dbName(userId));
    instances.set(userId, db);
  }
  return db;
}

/**
 * Pastikan index pouchdb-find sudah ada (idempotent per DB). Index:
 * - `type` → query doc per jenis (parameter/depth/canal/meta).
 * - `updatedAt` → urut perubahan terbaru.
 * Outbox di-query lewat allDocs prefix range, jadi tidak perlu index khusus.
 */
export function ensureIndexes(userId: string): Promise<void> {
  let ready = indexReady.get(userId);
  if (!ready) {
    const db = getPouch(userId);
    ready = Promise.all([
      db.createIndex({ index: { fields: ['type'] } }),
      db.createIndex({ index: { fields: ['type', 'updatedAt'] } }),
    ]).then(() => undefined);
    indexReady.set(userId, ready);
  }
  return ready;
}

/** Tutup + buang instance (dipanggil saat logout akun ini). */
export async function closePouch(userId: string): Promise<void> {
  const db = instances.get(userId);
  if (db) {
    await db.close();
    instances.delete(userId);
    indexReady.delete(userId);
  }
}

/**
 * Hancurkan DB akun (dipanggil saat re-seed "Pouch lokal korup" / Reset lokal).
 * Setelah ini, getPouch() membuat DB kosong baru.
 */
export async function destroyPouch(userId: string): Promise<void> {
  const db = getPouch(userId);
  await db.destroy();
  instances.delete(userId);
  indexReady.delete(userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Akses doc data domain (SyncDoc)
// ─────────────────────────────────────────────────────────────────────────────

/** Ambil 1 SyncDoc by id, null kalau tidak ada. */
export async function getDoc<T = Record<string, unknown>>(
  userId: string,
  id: string,
): Promise<SyncDoc<T> | null> {
  try {
    const doc = await getPouch(userId).get(id);
    return doc as unknown as SyncDoc<T>;
  } catch {
    return null;
  }
}

/**
 * Query SyncDoc by type via pouchdb-find. Mengembalikan hanya doc data
 * (outbox & _local/_design tidak punya field `type` → otomatis tersaring).
 */
export async function findByType(
  userId: string,
  type: SyncDocType,
): Promise<SyncDoc[]> {
  await ensureIndexes(userId);
  const res = await getPouch(userId).find({
    selector: { type },
    sort: [{ type: 'asc' }],
  });
  return res.docs as unknown as SyncDoc[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Akses meta sync
// ─────────────────────────────────────────────────────────────────────────────

/** Baca meta sync (lastSeq, lastSyncedAt). Default kosong kalau belum ada. */
export async function getSyncMeta(userId: string): Promise<SyncMeta> {
  try {
    const doc = await getPouch(userId).get(SYNC_META_ID);
    return doc as unknown as SyncMeta;
  } catch {
    return { _id: SYNC_META_ID, lastSeq: null, lastSyncedAt: null };
  }
}

/** Tulis/merge meta sync. */
export async function putSyncMeta(
  userId: string,
  patch: Partial<Omit<SyncMeta, '_id' | '_rev'>>,
): Promise<void> {
  const db = getPouch(userId);
  const cur = await getSyncMeta(userId);
  await db.put({ ...cur, ...patch, _id: SYNC_META_ID });
}
