/**
 * Service Pengukuran — singleton threshold (lulus/toleransi/tidakLulus).
 * Logika murni atas model shared `Pengukuran`. Dipakai controller + bisa dibaca
 * fitur lain (qc/chart untuk warna depth, reports untuk breakdown).
 *
 * NB: "Pengukuran" = data THRESHOLD, BUKAN pengukuran lapangan (nama legacy). Singleton:
 * praktiknya 1 dokumen. GET ambil dokumen pertama; create cuma boleh kalau belum ada.
 */
import { Types } from 'mongoose';
import { Pengukuran, type PengukuranDoc as RawPengukuranDoc } from '../../shared/models/Pengukuran.js';

/** Lean doc + `_id` (InferSchemaType di model shared belum sertakan `_id`). */
export type PengukuranDoc = RawPengukuranDoc & { _id: Types.ObjectId };

export interface ThresholdInput {
  tidakLulus: number;
  toleransi: { batasAwal: number; batasAkhir: number };
  lulus: number;
}

/** Ambil singleton threshold (dokumen pertama). null kalau belum di-set. */
export async function getThreshold(): Promise<PengukuranDoc | null> {
  return Pengukuran.findOne().lean<PengukuranDoc>().exec();
}

/**
 * Buat threshold. Karena singleton, tolak kalau sudah ada (suruh pakai PATCH).
 * Return { conflict: true } supaya controller balas 409.
 */
export async function createThreshold(
  input: ThresholdInput,
): Promise<{ doc: PengukuranDoc } | { conflict: true }> {
  const existing = await Pengukuran.findOne().exec();
  if (existing) return { conflict: true };
  const doc = await Pengukuran.create(input);
  return { doc: doc.toObject() as PengukuranDoc };
}

/** Update sebagian threshold by id. null kalau id invalid / tak ketemu. */
export async function updateThreshold(
  id: string,
  patch: Partial<ThresholdInput>,
): Promise<PengukuranDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const set: Record<string, unknown> = {};
  if (patch.tidakLulus !== undefined) set.tidakLulus = patch.tidakLulus;
  if (patch.lulus !== undefined) set.lulus = patch.lulus;
  if (patch.toleransi !== undefined) set.toleransi = patch.toleransi;
  return Pengukuran.findByIdAndUpdate(id, { $set: set }, { new: true })
    .lean<PengukuranDoc>()
    .exec();
}

export async function deleteThreshold(id: string): Promise<{ deleted: number }> {
  if (!Types.ObjectId.isValid(id)) return { deleted: 0 };
  const res = await Pengukuran.deleteOne({ _id: id }).exec();
  return { deleted: res.deletedCount ?? 0 };
}
