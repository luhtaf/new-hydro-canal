/**
 * API client auth — axios + interceptor.
 *
 * Online = **session cookie biasa** (spec § C "no token akrobat"): kirim
 * `withCredentials: true`, server set cookie HttpOnly. TIDAK ada Authorization
 * header / refresh token.
 *
 * Interceptor 401 → kunci app (AppLockScreen) bukan langsung logout: sesi server
 * habis tapi state lokal "logged-in" tetap sticky sampai logout eksplisit
 * (spec § C). User unlock → alur re-auth online jalan saat sync engine retry.
 *
 * NB: dependency `axios` belum ada di package.json scaffold → dicatat di missingDeps.
 */
import axios, { type AxiosInstance } from 'axios';
import { useLockStore } from './lock.js';
import { useAuthStore } from './store.js';
import type { Role, UsvCode } from '../../shared/types.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // session cookie
  timeout: 15_000,
});

// 401 → kunci app. Kalau gembok dimatikan user, jatuhkan ke logout akun aktif.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const lock = useLockStore.getState();
      if (lock.enabled && lock.pinSet) {
        lock.lock();
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tipe payload auth (kontrak dengan slice be-auth)
// ─────────────────────────────────────────────────────────────────────────────

/** Body POST /auth/login. Identity utama = email; usv opsional untuk stempel klien. */
export interface LoginPayload {
  email: string;
  pin: string;
  /** USV code untuk sesi lapangan (ikut data assignment, bukan identitas). */
  usv?: UsvCode;
}

/** Profil yang server kembalikan saat login sukses (tanpa pinHash). */
export interface AuthProfile {
  userId: string;
  name: string;
  email: string;
  idpSubject?: string | null;
  role: Role;
  usv: UsvCode | null;
  initials: string;
}

/**
 * Bentuk user MENTAH dari server (be-auth `toPublicUser`): identity field = `id`.
 * Slice FE ini canonical-nya `userId` (store keyed userId + PouchDB namespace),
 * jadi kita map di boundary ini — jangan bocorkan `id` ke store/komponen.
 */
interface ServerUser {
  id: string;
  name: string;
  email: string;
  idpSubject?: string | null;
  role: Role;
  usv: UsvCode | null;
  initials: string;
}

function toAuthProfile(u: ServerUser): AuthProfile {
  return {
    userId: u.id,
    name: u.name,
    email: u.email,
    idpSubject: u.idpSubject ?? null,
    role: u.role,
    usv: u.usv,
    initials: u.initials,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  /** Login online (enroll / add account). Server set session cookie. */
  async login(payload: LoginPayload): Promise<AuthProfile> {
    const { data } = await apiClient.post<{ user: ServerUser }>('/auth/login', payload);
    return toAuthProfile(data.user);
  },

  /** Logout server-side (best-effort; state lokal di-handle store). */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // offline / sesi sudah mati — abaikan, logout lokal tetap jalan.
    }
  },

  /** Cek sesi + status revoke akun (dipanggil saat device online lagi). */
  async me(): Promise<AuthProfile & { revoked: boolean }> {
    const { data } = await apiClient.get<{
      user: ServerUser;
      revoked: boolean;
    }>('/auth/me');
    return { ...toAuthProfile(data.user), revoked: data.revoked };
  },
};
