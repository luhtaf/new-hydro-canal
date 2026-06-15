/**
 * Akses model untuk slice sync — TANPA meng-author model milik slice lain.
 *
 * Sync TIDAK meng-own model apa pun: ia memproyeksikan doc kecil flat ke model
 * SHARED yang di-own slice lain (Data → slice `data`, Canal → `canal`, District →
 * `district`, Contractor → `contractor`, Pengukuran/threshold → `pengukuran`).
 *
 * Guardrail global #1: model punya owner → sync IMPORT, bukan bikin sendiri.
 * Tapi saat slice sync dibangun, slice owner mungkin belum mendaftarkan model-nya.
 * Solusi: resolve model lewat registry mongoose by-name secara lazy. Begitu slice
 * owner meng-`mongoose.model(...)`, sync otomatis pakai schema asli. Untuk test,
 * registrasikan schema minimal (lihat models.test-helpers / integration test).
 *
 * Doc kecil flat (parameter/depth) TIDAK punya collection sendiri di Mongo —
 * ia dirakit jadi `Data` nested via projection.ts. Yang butuh persistensi sendiri:
 *  - SyncCursor: titik pull terakhir per-user (server-side, audit + cadangan).
 *  - SyncDocMeta: `updatedAt` proyeksi per-canalId. WAJIB karena model legacy `Data`
 *    sengaja TANPA `timestamps` (jangan diubah — kompat data lama). Ini basis conflict
 *    detection (serverBase vs serverUpdatedAt) dan cursor `pull?since=`.
 *
 * Catatan owner-mapping (frontmatter CLAUDE.md `uses_models`):
 *   Data, Canal, District, Contractor, Pengukuran.
 */
import mongoose, { Schema, type Model } from 'mongoose';

/** Nama model shared yang dipakai sync. Harus sama dengan yang didaftarkan slice owner. */
export const MODEL = {
  Data: 'Data',
  Canal: 'Canal',
  District: 'District',
  Contractor: 'Contractor',
  Pengukuran: 'Pengukuran',
} as const;

export type ModelName = (typeof MODEL)[keyof typeof MODEL];

/**
 * Ambil model yang sudah didaftarkan slice owner. Throw jelas kalau belum ada,
 * supaya kegagalan terbaca "slice X belum mount" bukan "undefined.find".
 */
export function getModel<T = unknown>(name: ModelName): Model<T> {
  const existing = mongoose.models[name];
  if (!existing) {
    throw new Error(
      `Model "${name}" belum terdaftar. Pastikan slice owner-nya sudah di-import sebelum sync dipakai.`,
    );
  }
  return existing as unknown as Model<T>;
}

/** True kalau model owner sudah terdaftar (dipakai untuk degrade seed dengan aman). */
export function hasModel(name: ModelName): boolean {
  return Boolean(mongoose.models[name]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Model yang BENAR-BENAR di-own slice sync (server-side bookkeeping).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cursor pull per-user: menyimpan `lastSeq` agar `pull?since=` punya basis stabil.
 * (Client tetap kirim `since`; ini cadangan + audit.)
 */
export interface SyncCursorDoc {
  userId: string;
  lastSeq: string; // ISO updatedAt terbesar yang sudah dikirim
  updatedAt: Date;
}

const syncCursorSchema = new Schema<SyncCursorDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    lastSeq: { type: String, required: true, default: '1970-01-01T00:00:00.000Z' },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'sync_cursors' },
);

export function SyncCursor(): Model<SyncCursorDoc> {
  return (
    (mongoose.models.SyncCursor as Model<SyncCursorDoc> | undefined) ??
    mongoose.model<SyncCursorDoc>('SyncCursor', syncCursorSchema)
  );
}

/**
 * Stempel waktu sync per-canal. PENTING: model legacy `Data` SENGAJA tanpa `timestamps`
 * (jangan diubah — guardrail "extend, bukan replace" + kompat dokumen lama). Jadi sync
 * menyimpan `updatedAt` proyeksinya sendiri di collection ini, by `canalId`. Inilah
 * basis conflict detection (serverBase vs serverUpdatedAt) dan cursor `pull?since=`.
 */
export interface SyncDocMetaDoc {
  /** kunci proyeksi = canalId (1 canal = 1 Data segment). */
  canalId: string;
  /** ISO updatedAt server terakhir proyeksi ini berubah. */
  updatedAt: string;
}

const syncDocMetaSchema = new Schema<SyncDocMetaDoc>(
  {
    canalId: { type: String, required: true, unique: true, index: true },
    updatedAt: { type: String, required: true },
  },
  { collection: 'sync_doc_meta' },
);

export function SyncDocMeta(): Model<SyncDocMetaDoc> {
  return (
    (mongoose.models.SyncDocMeta as Model<SyncDocMetaDoc> | undefined) ??
    mongoose.model<SyncDocMetaDoc>('SyncDocMeta', syncDocMetaSchema)
  );
}
