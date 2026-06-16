/**
 * Service Notification — logika di atas model shared `Notification`.
 *
 * Notif itu PER USER: query selalu di-scope `userId` dari sesi (controller yang ambil
 * dari getAuthUser, service tinggal terima). Tidak ada Express di sini — bisa dipanggil
 * fitur lain (mis. [undangan]/[penugasan]/[sync] yang mau NULIS notif lewat `create`).
 *
 * Bentuk wire (DTO) = `Notification` di shared/types.ts: `_id`/`userId` string, `ts` ISO.
 * Model Mongoose menyimpan ObjectId + Date → `toDto` yang menormalkan.
 */
import { Types } from 'mongoose';
import {
  Notification,
  type NotificationDoc,
} from '../../shared/models/Notification.js';
import type {
  Notification as NotificationDto,
  NotificationColor,
  NotificationKind,
} from '../../shared/types.js';

/** Lean shape yang dipakai internal (subset NotificationDoc tanpa method Mongoose). */
type LeanNotif = Pick<
  NotificationDoc,
  | '_id'
  | 'userId'
  | 'kind'
  | 'icon'
  | 'color'
  | 'title'
  | 'body'
  | 'read'
  | 'ts'
  | 'link'
>;

/** Normalisasi doc Mongo → DTO wire (ObjectId/Date → string). */
function toDto(n: LeanNotif): NotificationDto {
  return {
    _id: String(n._id),
    userId: String(n.userId),
    kind: n.kind as NotificationKind,
    icon: n.icon ?? '',
    color: (n.color ?? 'brand') as NotificationColor,
    title: n.title,
    body: n.body ?? '',
    read: Boolean(n.read),
    ts: (n.ts instanceof Date ? n.ts : new Date(n.ts)).toISOString(),
    link: n.link ?? undefined,
  };
}

export interface InboxResult {
  /** Notif milik user, terbaru dulu. */
  items: NotificationDto[];
  /** Jumlah yang belum dibaca (untuk badge sidebar + tab title). */
  unread: number;
}

/**
 * Inbox 1 user: daftar notif (terbaru dulu) + hitungan unread.
 * `limit` default 50 — inbox bukan riwayat tak terbatas; notif lama TTL/diabaikan.
 */
export async function listMine(
  userId: string,
  limit = 50,
): Promise<InboxResult> {
  const uid = new Types.ObjectId(userId);
  const [items, unread] = await Promise.all([
    Notification.find({ userId: uid })
      .sort({ ts: -1 })
      .limit(limit)
      .lean<LeanNotif[]>()
      .exec(),
    Notification.countDocuments({ userId: uid, read: false }).exec(),
  ]);
  return { items: items.map(toDto), unread };
}

/**
 * Tandai 1 notif dibaca. Guard `userId` supaya user tak bisa baca/ubah notif orang lain
 * (defense-in-depth: id ditebak pun tetap ter-scope ke pemilik sesi).
 * Return DTO notif ter-update, atau null kalau bukan milik user / tak ada.
 */
export async function markRead(
  userId: string,
  notifId: string,
): Promise<NotificationDto | null> {
  if (!Types.ObjectId.isValid(notifId)) return null;
  const updated = await Notification.findOneAndUpdate(
    { _id: new Types.ObjectId(notifId), userId: new Types.ObjectId(userId) },
    { $set: { read: true } },
    { new: true },
  )
    .lean<LeanNotif>()
    .exec();
  return updated ? toDto(updated) : null;
}

/**
 * Tandai SEMUA notif user dibaca. Return jumlah yang berubah (yang tadinya unread).
 */
export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const res = await Notification.updateMany(
    { userId: new Types.ObjectId(userId), read: false },
    { $set: { read: true } },
  ).exec();
  return { updated: res.modifiedCount ?? 0 };
}

/**
 * Buat notif baru untuk 1 user. Dipakai fitur lain ([undangan]/[penugasan]/[sync])
 * sebagai satu-satunya jalur produksi notif — jangan `Notification.create` langsung
 * di slice lain supaya bentuk default (color/icon/ts) konsisten.
 */
export interface CreateNotifInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  icon?: string;
  color?: NotificationColor;
  link?: string;
}

export async function createForUser(
  input: CreateNotifInput,
): Promise<NotificationDto> {
  const doc = await Notification.create({
    userId: new Types.ObjectId(input.userId),
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    icon: input.icon ?? '',
    color: input.color ?? 'brand',
    link: input.link,
    read: false,
    ts: new Date(),
  });
  return toDto(doc.toObject() as LeanNotif);
}
