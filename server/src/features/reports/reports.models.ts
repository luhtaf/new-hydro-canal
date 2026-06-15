/**
 * Akses model untuk slice reports — DECOUPLED dari slice [shared-models]
 * (pola sama dgn data.models.ts): ambil model lewat `mongoose.model(name)` by
 * registered name supaya slice ini typecheck mandiri (TS strict) tanpa bergantung
 * urutan kompilasi barrel shared-models.
 *
 * Reports = read-only/agregasi: hanya butuh `Canal` (sumber kebenaran status +
 * outcome QC per kanal) dan `User` (daftar operator + productivityCache). Tidak
 * menulis apa pun.
 *
 * Kontrak nama model (sinkron dgn shared-models):
 *   - 'Canal' → koleksi `canals` (1 row Excel AOI = 1 canal, DOMAIN CRITICAL)
 *   - 'User'  → koleksi users (akun = orang)
 */
import mongoose, { type Model } from 'mongoose';
import type { Canal, User } from '../../shared/types.js';

type CanalDoc = Canal;
type UserDoc = User;

function requireModel<T>(name: string): Model<T> {
  const m = mongoose.models[name] as Model<T> | undefined;
  if (!m) {
    throw new Error(
      `Model '${name}' belum teregistrasi — pastikan shared-models di-import sebelum route reports dipakai.`,
    );
  }
  return m;
}

/** Model 'Canal' yang sudah diregistrasi shared-models. */
export function canalModel(): Model<CanalDoc> {
  return requireModel<CanalDoc>('Canal');
}

/** Model 'User' yang sudah diregistrasi shared-models. */
export function userModel(): Model<UserDoc> {
  return requireModel<UserDoc>('User');
}
