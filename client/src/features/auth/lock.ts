/**
 * App-lock — gembok buka-app lokal (spec § C "App-lock PIN/biometrik ON by default").
 *
 * BUKAN token / bukan auth ke server. Ini gembok lokal untuk membuka app di device:
 * - ON by default (privasi device lapangan; mitigasi device hilang, lihat spec § C tradeoff).
 * - Bisa dimatikan di settings (`disableLock`).
 * - PIN unlock-app GLOBAL device (bukan per-akun) — 1 device 1 pemegang fisik.
 *   PIN login per-akun (verifikasi ke server) hidup terpisah di alur online.
 * - Biometrik via WebAuthn platform authenticator kalau tersedia; PIN selalu fallback.
 *
 * PIN di-hash pakai PBKDF2 (Web Crypto) — TIDAK pernah disimpan plaintext.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const PBKDF2_ITER = 150_000;

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

/** Hash PIN dengan salt via PBKDF2-SHA256. Return hex digest. */
async function hashPin(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const salt = Uint8Array.from(
    saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bufToHex(bits);
}

/** Apakah biometrik (platform authenticator) tersedia di device ini. */
export async function biometricAvailable(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !window.PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable
  ) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface LockState {
  /** Gembok app aktif. ON by default (spec § C). */
  enabled: boolean;
  /** PIN sudah di-set (kalau enabled tapi belum set → wajib set saat pertama). */
  pinSet: boolean;
  /** Sedang terkunci (true = tampilkan AppLockScreen). */
  locked: boolean;
  /** Biometrik diaktifkan user (selain PIN). */
  biometricEnabled: boolean;
  pinHash: string | null;
  saltHex: string | null;
}

interface LockActions {
  /** Set / ganti PIN gembok. */
  setPin: (pin: string) => Promise<void>;
  /** Verifikasi PIN; sukses → buka gembok. */
  unlockWithPin: (pin: string) => Promise<boolean>;
  /** Buka gembok via biometrik (caller sudah verifikasi WebAuthn). */
  unlockBiometric: () => void;
  /** Kunci app secara manual (mis. tombol "Kunci" / app kembali fokus). */
  lock: () => void;
  /** Matikan gembok (settings). Hapus PIN. */
  disableLock: () => void;
  /** Nyalakan gembok lagi (butuh setPin setelah ini). */
  enableLock: () => void;
  setBiometricEnabled: (on: boolean) => void;
}

export type LockStore = LockState & LockActions;

export const useLockStore = create<LockStore>()(
  persist(
    (set, get) => ({
      enabled: true, // ON by default — spec § C
      pinSet: false,
      // Mulai terkunci HANYA kalau PIN sudah di-set; kalau belum, alur enroll yang urus.
      locked: false,
      biometricEnabled: false,
      pinHash: null,
      saltHex: null,

      setPin: async (pin) => {
        const saltHex = randomHex(16);
        const pinHash = await hashPin(pin, saltHex);
        set({ pinHash, saltHex, pinSet: true, locked: false });
      },

      unlockWithPin: async (pin) => {
        const { pinHash, saltHex } = get();
        if (!pinHash || !saltHex) return false;
        const candidate = await hashPin(pin, saltHex);
        if (candidate === pinHash) {
          set({ locked: false });
          return true;
        }
        return false;
      },

      unlockBiometric: () => set({ locked: false }),

      lock: () => {
        if (get().enabled && get().pinSet) set({ locked: true });
      },

      disableLock: () =>
        set({
          enabled: false,
          locked: false,
          pinSet: false,
          pinHash: null,
          saltHex: null,
          biometricEnabled: false,
        }),

      enableLock: () => set({ enabled: true, pinSet: false }),

      setBiometricEnabled: (on) => set({ biometricEnabled: on }),
    }),
    {
      name: 'hydrocanal-lock',
      storage: createJSONStorage(() => localStorage),
      // `locked` runtime-only: app selalu mulai dengan gembok terpasang kalau
      // enabled+pinSet (di-set ulang oleh bootstrapLock saat mount).
      partialize: (s) => ({
        enabled: s.enabled,
        pinSet: s.pinSet,
        biometricEnabled: s.biometricEnabled,
        pinHash: s.pinHash,
        saltHex: s.saltHex,
      }),
    },
  ),
);

/**
 * Pasang gembok saat app start. Panggil sekali di AuthProvider mount:
 * kalau gembok ON & PIN sudah di-set → kunci (paksa AppLockScreen).
 */
export function bootstrapLock(): void {
  const s = useLockStore.getState();
  if (s.enabled && s.pinSet) {
    useLockStore.setState({ locked: true });
  }
}
