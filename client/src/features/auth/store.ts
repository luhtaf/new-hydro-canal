/**
 * Store auth multi-akun (Zustand + persist localStorage).
 *
 * Acuan: spec § C "Auth — Multi-akun, simpel (no token akrobat)".
 *
 * Model identitas: **akun = orang** (grain identitas). Tiap akun = 1 profil + status
 * lokal sendiri (PouchDB namespace `hydrocanal-<userId>`, indikator sync per-akun).
 * Switch antar akun ala Gmail; switch OFFLINE OK kalau akun itu sudah pernah login
 * online di device ini (`enrolled === true`).
 *
 * State "logged-in" = lokal & sticky: stay logged-in sampai logout eksplisit.
 * TIDAK ada refresh-token / trust-window math (online pakai session cookie biasa).
 *
 * Catatan offline-first: store ini sumber kebenaran SIAPA yang aktif & daftar akun.
 * Data domain (assignment, master) ada di PouchDB per-namespace, BUKAN di sini.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role, UsvCode } from '../../shared/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Tipe
// ─────────────────────────────────────────────────────────────────────────────

/** Status sinkron per-akun (spec § C "indikator sync per-akun"). */
export interface AccountSyncState {
  /** Jumlah doc di outbox yang belum terkirim (0 = full sync). */
  pending: number;
  /** ISO timestamp push sukses terakhir, null kalau belum pernah. */
  lastSyncedAt: string | null;
}

/**
 * 1 akun ter-enroll di device ini. Subset profil User (tanpa pinHash — PIN
 * disimpan di-hash terpisah, lihat `lock.ts`). Identity utama = email.
 */
export interface Account {
  /** = User._id dari server. Dipakai jadi PouchDB namespace `hydrocanal-<userId>`. */
  userId: string;
  name: string;
  email: string;
  /** Disisakan untuk bolt-on SSO; kosong selama auth lokal. */
  idpSubject?: string | null;
  role: Role;
  /** KBN01–05 untuk operator, null untuk admin. USV ikut data, bukan identitas. */
  usv: UsvCode | null;
  initials: string;
  /** true = akun sudah pernah login online di device ini → boleh switch offline. */
  enrolled: boolean;
  /** true = admin server me-revoke akun ini (efektif saat device online lagi). */
  revoked: boolean;
  /** ISO kapan akun ini ter-enroll/ditambah. */
  addedAt: string;
  sync: AccountSyncState;
}

interface AuthState {
  /** userId akun yang sedang aktif, null = belum ada akun aktif (ke /login). */
  activeUserId: string | null;
  /** Semua akun ter-enroll di device, keyed by userId. */
  accounts: Record<string, Account>;
  /**
   * Override role untuk sesi berjalan (RoleSwitcher demo / admin lihat-as-operator).
   * null = pakai role asli akun aktif.
   */
  roleOverride: Role | null;
}

interface AuthActions {
  /** Tambah/replace akun (dipakai LoginPage & AccountSwitcher add-account). */
  upsertAccount: (acc: Account) => void;
  /** Switch akun aktif. Caller WAJIB cek `enrolled` dulu kalau offline. */
  switchAccount: (userId: string) => void;
  /** Logout eksplisit akun aktif: hapus dari daftar, pindah ke akun lain / null. */
  logout: (userId?: string) => void;
  /** Tandai akun sudah pernah online (dipanggil setelah sync/seed sukses). */
  markEnrolled: (userId: string) => void;
  /** Set flag revoked (dari respons server saat online). */
  setRevoked: (userId: string, revoked: boolean) => void;
  /** Update indikator sync per-akun (dipanggil sync engine). */
  setSyncState: (userId: string, sync: Partial<AccountSyncState>) => void;
  /** Ganti role override sesi (RoleSwitcher). null = reset ke role asli. */
  setRoleOverride: (role: Role | null) => void;
}

export type AuthStore = AuthState & AuthActions;

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      activeUserId: null,
      accounts: {},
      roleOverride: null,

      upsertAccount: (acc) =>
        set((s) => ({
          accounts: { ...s.accounts, [acc.userId]: acc },
          // Akun yang baru di-add langsung jadi aktif (ala Gmail "Tambah akun").
          activeUserId: acc.userId,
          roleOverride: null,
        })),

      switchAccount: (userId) =>
        set((s) =>
          s.accounts[userId]
            ? { activeUserId: userId, roleOverride: null }
            : s,
        ),

      logout: (userId) =>
        set((s) => {
          const target = userId ?? s.activeUserId;
          if (!target) return s;
          const next = { ...s.accounts };
          delete next[target];
          const rest = Object.keys(next);
          return {
            accounts: next,
            activeUserId:
              s.activeUserId === target ? (rest[0] ?? null) : s.activeUserId,
            roleOverride: null,
          };
        }),

      markEnrolled: (userId) =>
        set((s) => {
          const acc = s.accounts[userId];
          if (!acc) return s;
          return {
            accounts: { ...s.accounts, [userId]: { ...acc, enrolled: true } },
          };
        }),

      setRevoked: (userId, revoked) =>
        set((s) => {
          const acc = s.accounts[userId];
          if (!acc) return s;
          return {
            accounts: { ...s.accounts, [userId]: { ...acc, revoked } },
          };
        }),

      setSyncState: (userId, sync) =>
        set((s) => {
          const acc = s.accounts[userId];
          if (!acc) return s;
          return {
            accounts: {
              ...s.accounts,
              [userId]: { ...acc, sync: { ...acc.sync, ...sync } },
            },
          };
        }),

      setRoleOverride: (role) => {
        // Override hanya valid kalau ada akun aktif.
        if (!get().activeUserId) return;
        set({ roleOverride: role });
      },
    }),
    {
      name: 'hydrocanal-auth',
      storage: createJSONStorage(() => localStorage),
      // roleOverride sengaja TIDAK dipersist — reset tiap reload (sesi-only).
      partialize: (s) => ({
        activeUserId: s.activeUserId,
        accounts: s.accounts,
      }),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Selector helper (dipakai hooks + komponen)
// ─────────────────────────────────────────────────────────────────────────────

/** Akun aktif (atau null). */
export function selectActiveAccount(s: AuthStore): Account | null {
  return s.activeUserId ? (s.accounts[s.activeUserId] ?? null) : null;
}

/** Daftar akun ter-enroll (urut waktu ditambah). */
export function selectAccounts(s: AuthStore): Account[] {
  return Object.values(s.accounts).sort((a, b) =>
    a.addedAt.localeCompare(b.addedAt),
  );
}

/** Role efektif: override sesi kalau ada, kalau tidak role asli akun aktif. */
export function selectEffectiveRole(s: AuthStore): Role | null {
  const acc = selectActiveAccount(s);
  if (!acc) return null;
  return s.roleOverride ?? acc.role;
}
