/**
 * Logika auth: verifikasi PIN (bcrypt), ganti PIN, revoke. Tanpa Express — pure
 * supaya gampang di-test. Controller yang urus req/res/sesi.
 */
import bcrypt from 'bcrypt';
import { UserModel } from '../../shared/models/index.js';
import type { Role, UsvCode } from '../../shared/types.js';

const BCRYPT_COST = 12;
/** PIN 4-6 digit (spec § C "app-lock PIN/biometrik"). */
const PIN_REGEX = /^\d{4,6}$/;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  usv: UsvCode | null;
  status: 'aktif' | 'cuti';
  tokenVersion: number;
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && PIN_REGEX.test(pin);
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_COST);
}

/**
 * Verifikasi kredensial. Terima email ATAU usv sebagai identifier (multi-akun:
 * operator lapangan sering kenal USV-nya, admin pakai email). Return PublicUser
 * kalau cocok, null kalau gagal (jangan bocorkan alasan — anti user enumeration).
 */
export async function verifyCredentials(
  identifier: string,
  pin: string,
): Promise<PublicUser | null> {
  const id = identifier.trim();
  if (!id || !isValidPin(pin)) return null;

  const query = id.includes('@')
    ? { email: id.toLowerCase() }
    : { usv: id.toUpperCase() };

  const user = await UserModel.findOne(query).select('+pinHash');
  if (!user || user.revoked) return null;

  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) return null;

  user.lastActiveAt = new Date();
  await user.save();

  return toPublicUser(user);
}

export async function changePin(
  userId: string,
  oldPin: string,
  newPin: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isValidPin(newPin)) return { ok: false, reason: 'PIN baru harus 4-6 digit angka' };

  const user = await UserModel.findById(userId).select('+pinHash');
  if (!user) return { ok: false, reason: 'User tidak ditemukan' };

  const ok = await bcrypt.compare(oldPin, user.pinHash);
  if (!ok) return { ok: false, reason: 'PIN lama salah' };

  user.pinHash = await hashPin(newPin);
  await user.save();
  return { ok: true };
}

/**
 * Revoke akun (admin). Naikkan tokenVersion + set revoked → sesi lama ditolak
 * saat device online lagi (spec § C). Operator tetap bisa kerja offline sampai
 * sync berikutnya — itu tradeoff yang diakui di spec.
 */
export async function revokeUser(targetUserId: string): Promise<boolean> {
  const res = await UserModel.updateOne(
    { _id: targetUserId },
    { $set: { revoked: true }, $inc: { tokenVersion: 1 } },
  );
  return res.matchedCount > 0;
}

export function toPublicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  initials: string;
  role: Role;
  usv: UsvCode | null;
  status: 'aktif' | 'cuti';
  tokenVersion?: number;
}): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    initials: user.initials,
    role: user.role,
    usv: user.usv,
    status: user.status,
    tokenVersion: user.tokenVersion ?? 0,
  };
}
