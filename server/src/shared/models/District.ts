/**
 * Model District (shared) — di-port + extend dari existing `Districts`.
 *
 * Shared karena dipakai >=2 fitur: [district] (CRUD owner), [qc] (kode 4-char untuk
 * output filename), [reports] (group per-region). Owner logika CRUD = fitur `district`,
 * tapi model-nya shared supaya fitur lain bisa import tanpa depend ke folder fitur.
 *
 * Extend (BUKAN replace) schema lama: `regionName` + `contractorId` baru (PLAN-BE.md).
 * Field lama `districtName` + `districtId` dipertahankan persis untuk kompat data.
 */
import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const districtSchema = new Schema(
  {
    /** existing — nama distrik, mis. "D.SUNGAI_BEYUKU". */
    districtName: { type: String, required: true, trim: true },
    /** existing — kode 4-char untuk output filename (mis. "3C01"). */
    districtId: { type: String, required: true, trim: true },
    /** BARU — region grouping (header AOI, mis. "Palembang"). */
    regionName: { type: String, trim: true, default: null },
    /** BARU — link ke Contractor (opsional). */
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', default: null },
  },
  {
    // Pakai nama collection legacy "districts" supaya kompat data lama.
    collection: 'districts',
    timestamps: false,
  },
);

// Lookup cepat saat seeding & generate filename.
districtSchema.index({ districtName: 1 });
districtSchema.index({ districtId: 1 });

/** Bentuk lean/plain dokumen (termasuk `_id`, yang tidak ada di InferSchemaType). */
export type DistrictDoc = InferSchemaType<typeof districtSchema> & { _id: Types.ObjectId };

// Hindari OverwriteModelError saat hot-reload / multi-import di test.
export const District: Model<DistrictDoc> =
  (mongoose.models.District as Model<DistrictDoc>) ??
  model<DistrictDoc>('District', districtSchema);
