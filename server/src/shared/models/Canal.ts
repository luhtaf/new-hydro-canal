/**
 * Model SHARED: Canal — 1 row Excel AOI = 1 Canal ID dengan Order No SENDIRI.
 *
 * ⚠️ DOMAIN.md CRITICAL: Order No unik PER CANAL (bukan per undangan). Versi awal app
 * salah memodelkan ini → sudah direvisi.
 *
 * Shared karena dipakai banyak fitur: [aoi] (dibuat saat import), [penugasan]/[canal]
 * (assign/unassign, query "penugasan saya"), [qc] (status Done + qcOutput), [sync]
 * (admin-field status/assignedTo = server-wins), [reports]. Tak ada owner CRUD tunggal
 * → shared/models.
 *
 * Shape plain object = `Canal` di shared/types.ts.
 */
import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const canalSchema = new Schema(
  {
    aoiId: { type: Schema.Types.ObjectId, ref: 'Aoi', required: true },
    // ── dari Excel ──
    district: { type: String, required: true, trim: true }, // "D.SUNGAI_BEYUKU"
    /** Unik, 10 digit. Identitas canonical 1 row AOI. */
    orderNo: { type: String, required: true, trim: true },
    requestDate: { type: Date, required: true },
    requestType: { type: String, enum: ['QC', 'RE-QC'], default: 'QC' },
    canalId: { type: String, required: true, trim: true }, // "SB180202"
    panjang: { type: Number, required: true }, // meter
    dimensi: { type: String, default: '' }, // "8X5X3" (PxLxT)
    measurePoint: { type: String, default: '' }, // numerik tanpa spasi
    startDate: { type: Date, required: true },
    finishDate: { type: Date, required: true }, // acuan clamp Measure Date
    contractor: { type: String, required: true, trim: true }, // full name
    coordX: { type: Number, required: true }, // UTM Easting (zona 48S)
    coordY: { type: Number, required: true }, // UTM Northing
    status: {
      type: String,
      enum: ['Submitted', 'Assigned', 'In Progress', 'Done'],
      default: 'Submitted',
    },
    // ── assigning ──
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
    usv: {
      type: String,
      enum: ['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05', null],
      default: null,
    },
    // ── outcome ──
    /** Filename TXT saat status Done (DOMAIN.md poin 7). */
    qcOutput: { type: String, default: null },
    /** Link ke Data document existing (post-input). */
    dataId: { type: Schema.Types.ObjectId, ref: 'Data', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'canals' },
);

// ── Indexes (PLAN-BE.md "Indexes") ──
canalSchema.index({ orderNo: 1 }, { unique: true }); // identitas canonical
canalSchema.index({ assignedTo: 1, status: 1 }); // query "penugasan saya"
canalSchema.index({ contractor: 1, district: 1 }); // "canal lain di kombinasi sama"
canalSchema.index({ status: 1, requestDate: -1 }); // list + sort
canalSchema.index({ aoiId: 1 }); // canals per AOI

/** Bentuk lean/plain dokumen (termasuk `_id`, yang tidak ada di InferSchemaType). */
export type CanalDoc = InferSchemaType<typeof canalSchema> & { _id: Types.ObjectId };

export const Canal: Model<CanalDoc> =
  (mongoose.models.Canal as Model<CanalDoc>) ?? model<CanalDoc>('Canal', canalSchema);
