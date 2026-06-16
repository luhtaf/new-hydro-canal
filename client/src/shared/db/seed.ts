/**
 * seed.ts — seed awal PouchDB dari server (spec § C "tarik data via /sync/seed",
 * § D "re-seed dari server saat Pouch lokal korup").
 *
 * Dipanggil:
 * - setelah login pertama akun (enroll) → isi DB kosong dengan assignment + master.
 * - saat "Reset lokal" / DB korup → destroy lalu seed ulang.
 *
 * Server = source-of-truth assignment + master. Seed bersifat bulk-overwrite
 * (server-doc menang), aman dijalankan ulang (idempotent).
 */
import { getPouch, ensureIndexes, putSyncMeta, destroyPouch } from './pouch.js';
import type { SyncDoc } from '../types.js';

const SEED_URL = '/sync/seed';

/** Response GET /sync/seed. */
export interface SeedResponse {
  /** Snapshot doc kecil flat untuk akun ini (assignment + master + draft). */
  docs: SyncDoc[];
  /** seq awal untuk pull inkremental berikutnya. */
  lastSeq: string;
}

/**
 * Tarik seed & tulis ke Pouch (bulk). Doc server di-stempel serverBase =
 * updatedAt-nya supaya edit lokal berikutnya bisa dideteksi konfliknya.
 * Mengembalikan jumlah doc yang ter-seed.
 */
export async function seed(userId: string): Promise<number> {
  await ensureIndexes(userId);
  const res = await fetch(SEED_URL, { credentials: 'include' });
  if (!res.ok) throw new Error(`seed HTTP ${res.status}`);
  const data = (await res.json()) as SeedResponse;

  const db = getPouch(userId);
  const prepared = await Promise.all(
    data.docs.map(async (d) => {
      let rev: string | undefined;
      try {
        rev = (await db.get(d._id))._rev;
      } catch {
        /* doc baru */
      }
      return {
        ...(d as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>),
        serverBase: d.updatedAt,
        _rev: rev,
      };
    }),
  );
  if (prepared.length) await db.bulkDocs(prepared);
  await putSyncMeta(userId, {
    lastSeq: data.lastSeq,
    lastSyncedAt: new Date().toISOString(),
  });
  return prepared.length;
}

/**
 * Re-seed total: hancurkan DB lokal lalu seed ulang dari server.
 * Dipakai untuk "Reset lokal" & recovery "Pouch lokal korup" (spec § D).
 * PERINGATAN: edit lokal yang belum tersinkron akan HILANG — caller harus
 * konfirmasi dulu (confirmDialog).
 */
export async function reseed(userId: string): Promise<number> {
  await destroyPouch(userId);
  return seed(userId);
}
