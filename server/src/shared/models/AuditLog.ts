/**
 * Model SHARED: AuditLog — jejak aksi (edit/sync/assign/threshold/login/export/import).
 *
 * Shared karena ditulis oleh banyak fitur (lewat middleware audit) & dibaca [reports]/[audit].
 * Field user di-denormalize (userName/userInitials) untuk display cepat tanpa join.
 *
 * Shape plain object = `AuditLog` di shared/types.ts.
 */
import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true }, // denormalized
    userInitials: { type: String, default: '' },
    action: {
      type: String,
      enum: ['edit', 'sync', 'assign', 'threshold', 'login', 'export', 'import'],
      required: true,
    },
    kind: { type: String, default: '' }, // "Drag-edit kedalaman", dll
    target: { type: String, default: '' }, // "KBN01-K02 · STA 720"
    detail: { type: String, default: undefined }, // "2.710 → 2.840"
    ts: { type: Date, default: Date.now },
  },
  { collection: 'auditlogs', minimize: false },
);

auditLogSchema.index({ ts: -1 });
auditLogSchema.index({ userId: 1, ts: -1 });
auditLogSchema.index({ action: 1, ts: -1 });
// TTL 1 tahun (configurable) — PLAN-BE.md.
auditLogSchema.index({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

/** Bentuk lean/plain dokumen (termasuk `_id`, yang tidak ada di InferSchemaType). */
export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & {
  _id: Types.ObjectId;
};

export const AuditLog: Model<AuditLogDoc> =
  (mongoose.models.AuditLog as Model<AuditLogDoc>) ??
  model<AuditLogDoc>('AuditLog', auditLogSchema);
