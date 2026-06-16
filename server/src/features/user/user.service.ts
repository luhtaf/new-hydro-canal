/**
 * Service User — manajemen akun operator/admin (admin-only). Pure (tanpa Express)
 * supaya gampang di-test; controller yang urus req/res + audit.
 *
 * Pakai model SHARED `UserModel` (akun = orang, spec § C). PIN selalu di-hash bcrypt
 * (reuse `hashPin` dari slice [auth] — JANGAN duplikat cost/regex). Soft delete =
 * naikkan `tokenVersion` + set `revoked: true` (sama mekanisme revoke auth): sesi
 * lama ditolak saat device online lagi, dan akun disembunyikan dari list default.
 */
import { Types } from 'mongoose';
import { UserModel } from '../../shared/models/index.js';
import type { Role, UsvCode, UserStatus } from '../../shared/types.js';
import { hashPin, isValidPin, type PublicUser } from '../auth/auth.service.js';

/** USV valid (operator). null untuk admin. */
const USV_CODES: readonly UsvCode[] = ['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05'];

export interface CreateUserInput {
  name: string;
  email: string;
  pin: string;
  role: Role;
  usv?: UsvCode | null;
  status?: UserStatus;
  /** opsional — kalau kosong di-derive dari `name`. */
  initials?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'pin'>>;

/** Hasil error domain dgn status HTTP (dipungut errorHandler shared). */
function httpError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

/** Derive inisial 2-char dari nama (mis. "Sari Putri" → "SP"). */
export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Validasi konsistensi role ↔ usv (DOMAIN/spec § C): operator WAJIB punya USV
 * (KBN01–05), admin TIDAK boleh punya USV. Lempar 400 kalau melanggar.
 */
function validateRoleUsv(role: Role, usv: UsvCode | null | undefined): UsvCode | null {
  if (role === 'operator') {
    if (!usv || !USV_CODES.includes(usv)) {
      throw httpError('Operator wajib punya USV (KBN01–KBN05)', 400);
    }
    return usv;
  }
  // admin → paksa null (USV ikut assignment, bukan identitas admin).
  return null;
}

/** Bentuk publik (TANPA pinHash) + field manajemen yang dibutuhkan tabel admin. */
export interface ManagedUser extends PublicUser {
  revoked: boolean;
  lastActiveAt: string;
  createdAt: string;
  productivityCache?: { kanal30d: number; passRate: number; reqcRate: number };
}

/** Bentuk lean/plain dari UserModel (longgar — lean() & toObject() beda tipe). */
interface UserLean {
  _id: unknown;
  name: string;
  email: string;
  initials: string;
  role: Role;
  usv: UsvCode | null;
  status: UserStatus;
  tokenVersion?: number;
  revoked?: boolean;
  lastActiveAt?: Date | string;
  createdAt?: Date | string;
  productivityCache?: { kanal30d?: number; passRate?: number; reqcRate?: number };
}

function toManagedUser(raw: unknown): ManagedUser {
  const doc = raw as UserLean;
  const pc = doc.productivityCache;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    initials: doc.initials,
    role: doc.role,
    usv: doc.usv,
    status: doc.status,
    tokenVersion: doc.tokenVersion ?? 0,
    revoked: Boolean(doc.revoked),
    lastActiveAt: new Date(doc.lastActiveAt ?? Date.now()).toISOString(),
    createdAt: new Date(doc.createdAt ?? Date.now()).toISOString(),
    productivityCache: pc
      ? { kanal30d: pc.kanal30d ?? 0, passRate: pc.passRate ?? 0, reqcRate: pc.reqcRate ?? 0 }
      : undefined,
  };
}

/**
 * List akun. Default sembunyikan yang ter-soft-delete (`revoked`); set
 * `includeRevoked` untuk audit. Urut: admin dulu, lalu nama.
 */
export async function listUsers(
  opts: { includeRevoked?: boolean } = {},
): Promise<ManagedUser[]> {
  const filter = opts.includeRevoked ? {} : { revoked: { $ne: true } };
  const docs = await UserModel.find(filter)
    .sort({ role: 1, name: 1 })
    .lean()
    .exec();
  return docs.map(toManagedUser);
}

export async function getUser(id: string): Promise<ManagedUser | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await UserModel.findById(id).lean().exec();
  return doc ? toManagedUser(doc) : null;
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const email = input.email.trim().toLowerCase();
  if (!isValidPin(input.pin)) {
    throw httpError('PIN harus 4–6 digit angka', 400);
  }
  const usv = validateRoleUsv(input.role, input.usv);

  const existing = await UserModel.findOne({ email }).select('_id').lean();
  if (existing) throw httpError('Email sudah dipakai akun lain', 409);

  const doc = await UserModel.create({
    name: input.name.trim(),
    email,
    pinHash: await hashPin(input.pin),
    role: input.role,
    usv,
    status: input.status ?? 'aktif',
    initials: (input.initials?.trim() || deriveInitials(input.name)).toUpperCase(),
  });
  return toManagedUser(doc.toObject());
}

/**
 * Update field akun (PATCH parsial). TIDAK menyentuh PIN (lihat `resetPin`).
 * Kalau role berubah → re-validate konsistensi USV.
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ManagedUser | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  const current = await UserModel.findById(id);
  if (!current) return null;

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) {
    set.name = input.name.trim();
    // inisial auto-ikut nama kalau caller tak override eksplisit.
    if (input.initials === undefined) set.initials = deriveInitials(input.name);
  }
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    const clash = await UserModel.findOne({ email, _id: { $ne: id } })
      .select('_id')
      .lean();
    if (clash) throw httpError('Email sudah dipakai akun lain', 409);
    set.email = email;
  }
  if (input.initials !== undefined) set.initials = input.initials.trim().toUpperCase();
  if (input.status !== undefined) set.status = input.status;

  // role/usv saling bergantung → resolve bersama.
  if (input.role !== undefined || input.usv !== undefined) {
    const role = input.role ?? current.role;
    const usv = input.usv !== undefined ? input.usv : current.usv;
    set.role = role;
    set.usv = validateRoleUsv(role, usv);
  }

  const doc = await UserModel.findByIdAndUpdate(id, { $set: set }, { new: true })
    .lean()
    .exec();
  return doc ? toManagedUser(doc) : null;
}

/**
 * Soft delete (PLAN-BE: "DELETE /users/:id (soft delete)"). Set `revoked: true`
 * + naikkan `tokenVersion` → akun hilang dari list & sesi lama ditolak saat online.
 * Tidak menghapus dokumen (jejak penugasan/audit historis tetap utuh).
 */
export async function softDeleteUser(id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const res = await UserModel.updateOne(
    { _id: id },
    { $set: { revoked: true }, $inc: { tokenVersion: 1 } },
  );
  return res.matchedCount > 0;
}

/**
 * Reset PIN akun (admin). Set PIN baru + naikkan `tokenVersion` (paksa re-login).
 * Beda dari `changePin` [auth] yang butuh PIN lama — di sini admin override.
 */
export async function resetPin(id: string, newPin: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  if (!isValidPin(newPin)) throw httpError('PIN baru harus 4–6 digit angka', 400);
  const res = await UserModel.updateOne(
    { _id: id },
    { $set: { pinHash: await hashPin(newPin), revoked: false }, $inc: { tokenVersion: 1 } },
  );
  return res.matchedCount > 0;
}
