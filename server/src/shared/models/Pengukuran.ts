/**
 * Model `Pengukuran` (collection legacy `pengukurans`) — PORT PERSIS, singleton.
 *
 * NB: nama collection legacy "Pengukuran" = data THRESHOLD (lulus/toleransi/tidakLulus),
 * BUKAN data pengukuran lapangan. Tetap 1 dokumen di koleksi (singleton).
 * Hanya admin yang boleh edit (DOMAIN.md poin 5).
 *
 * Acuan: PLAN-BE.md "Pengukuran (singleton threshold)"; shared/types.ts (Pengukuran).
 */
import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const toleransiSchema = new Schema(
  {
    batasAwal: { type: Number, required: true },
    batasAkhir: { type: Number, required: true },
  },
  { _id: false },
);

const pengukuranSchema = new Schema(
  {
    tidakLulus: { type: Number, required: true },
    toleransi: { type: toleransiSchema, required: true },
    lulus: { type: Number, required: true },
  },
  { collection: 'pengukurans', minimize: false },
);

export type PengukuranDoc = InferSchemaType<typeof pengukuranSchema>;

// Hindari OverwriteModelError saat hot-reload / multi-import di test.
export const Pengukuran: Model<PengukuranDoc> =
  (mongoose.models.Pengukuran as Model<PengukuranDoc>) ??
  model<PengukuranDoc>('Pengukuran', pengukuranSchema);
