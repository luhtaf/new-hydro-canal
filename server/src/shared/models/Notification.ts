/**
 * Model SHARED: Notification — notif per user (undangan/konflik/sync/penugasan/threshold).
 *
 * Shared karena dibuat oleh banyak fitur ([aoi] undangan, [sync] konflik, [penugasan])
 * dan dibaca oleh shell notifikasi global FE. Tak ada owner tunggal → shared/models.
 *
 * Shape plain object = `Notification` di shared/types.ts.
 */
import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: {
      type: String,
      enum: ['undangan', 'konflik', 'sync', 'penugasan', 'threshold'],
      required: true,
    },
    icon: { type: String, default: '' }, // nama ikon Lucide
    color: {
      type: String,
      enum: ['brand', 'rose', 'emerald', 'amber'],
      default: 'brand',
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    read: { type: Boolean, default: false },
    ts: { type: Date, default: Date.now },
    /** Hash route tujuan saat notif diklik, mis. "#/konflik". */
    link: { type: String, default: undefined },
  },
  { collection: 'notifications', minimize: false },
);

// Query "notif belum dibaca milik user, terbaru dulu".
notificationSchema.index({ userId: 1, read: 1, ts: -1 });

/** Bentuk lean/plain dokumen (termasuk `_id`, yang tidak ada di InferSchemaType). */
export type NotificationDoc = InferSchemaType<typeof notificationSchema> & {
  _id: Types.ObjectId;
};

export const Notification: Model<NotificationDoc> =
  (mongoose.models.Notification as Model<NotificationDoc>) ??
  model<NotificationDoc>('Notification', notificationSchema);
