/**
 * Model SHARED: Aoi — header 1 file Excel "AOI QC Canal USV Notification".
 *
 * Shared karena dipakai >=2 fitur: [aoi] (owner ingestion), [canal] (link aoiId),
 * [reports] (group per import). 1 Aoi = banyak Canal (1 row Excel = 1 Canal, DOMAIN.md CRITICAL).
 *
 * Shape plain object = `Aoi` di shared/types.ts.
 */
import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const aoiSchema = new Schema(
  {
    region: { type: String, required: true, trim: true }, // 'Palembang'
    area: { type: String, required: true, trim: true }, // 'SUMSEL P1'
    vendor: { type: String, required: true, trim: true }, // 'PT. KARTA BHUMI NUSANTARA'
    notificationTitle: {
      type: String,
      default: 'AOI QC Canal USV Notification',
      trim: true,
    },
    importedAt: { type: Date, default: Date.now },
    importedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    canalCount: { type: Number, default: 0 },
    /** Nama file Excel asli (audit/trace). */
    sourceFile: { type: String, default: undefined },
  },
  { collection: 'aois', minimize: false },
);

aoiSchema.index({ importedAt: -1 });
aoiSchema.index({ region: 1, importedAt: -1 });

/** Bentuk lean/plain dokumen (termasuk `_id`, yang tidak ada di InferSchemaType). */
export type AoiDoc = InferSchemaType<typeof aoiSchema> & { _id: Types.ObjectId };

export const Aoi: Model<AoiDoc> =
  (mongoose.models.Aoi as Model<AoiDoc>) ?? model<AoiDoc>('Aoi', aoiSchema);
