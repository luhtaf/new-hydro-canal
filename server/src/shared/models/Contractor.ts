/**
 * Model SHARED: Contractor — mapping fullName → shortName untuk header chart export.
 *
 * Shared karena dipakai >=2 fitur: [qc/chart] (shortName di header PNG, DOMAIN.md poin 8),
 * [aoi] (resolve contractor saat import), [district] (link contractorId). Tak ada owner
 * tunggal CRUD yang jelas → shared/models.
 *
 * Shape plain object = `Contractor` di shared/types.ts.
 */
import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const contractorSchema = new Schema(
  {
    /** Nama lengkap dari Excel AOI, mis. "PT CIPTA BUANA SAMUDRA". */
    fullName: { type: String, required: true, trim: true },
    /** Singkatan untuk chart header, mis. "PT. CBS". */
    shortName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'contractors' },
);

// fullName unik — dipakai resolve shortName + dedup saat import AOI.
contractorSchema.index({ fullName: 1 }, { unique: true });

/** Bentuk lean/plain dokumen (termasuk `_id`, yang tidak ada di InferSchemaType). */
export type ContractorDoc = InferSchemaType<typeof contractorSchema> & {
  _id: Types.ObjectId;
};

export const Contractor: Model<ContractorDoc> =
  (mongoose.models.Contractor as Model<ContractorDoc>) ??
  model<ContractorDoc>('Contractor', contractorSchema);
