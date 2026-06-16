/**
 * Model SHARED: User. Akun = orang (spec § C "grain identitas").
 *
 * Shared karena dipakai >=2 fitur (auth, penugasan, canal/assign, audit, reports)
 * dan tak ada owner tunggal — auth cuma "user pertama yang nyentuh". Sesuai
 * guardrail global #1: model lintas-fitur tanpa owner → shared/models.
 *
 * Shape plain object = `User` di shared/types.ts. Di sini Document Mongoose-nya.
 * pinHash SELALU di-select:false → tak pernah bocor ke response default.
 *
 * Identity utama = email (unique). idpSubject disisakan kosong untuk bolt-on SSO
 * di masa depan (spec § C: "sisakan field idpSubject (kosong)").
 */
import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    /** Disisakan kosong untuk bolt-on SSO (spec § C). Unik kalau ada (sparse). */
    idpSubject: { type: String, default: null, sparse: true },
    /** bcrypt hash PIN (cost 12). select:false → tak ikut query default. */
    pinHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'operator'], required: true },
    /** KBN01–05 untuk operator, null untuk admin. */
    usv: {
      type: String,
      enum: ['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05', null],
      default: null,
    },
    status: { type: String, enum: ['aktif', 'cuti'], default: 'aktif' },
    initials: { type: String, required: true },
    /**
     * Token version untuk revoke (spec § C "Admin bisa revoke akun").
     * Sesi yang aktif menyimpan tokenVersion saat login; saat angka ini dinaikkan
     * (revoke), middleware menolak sesi lama saat device online lagi.
     */
    tokenVersion: { type: Number, default: 0 },
    /** Akun di-nonaktifkan admin (soft revoke total). */
    revoked: { type: Boolean, default: false },
    productivityCache: {
      type: {
        kanal30d: Number,
        passRate: Number,
        reqcRate: Number,
      },
      default: undefined,
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true }, collection: 'users' },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const UserModel = model('User', userSchema);
