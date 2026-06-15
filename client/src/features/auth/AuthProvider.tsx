/**
 * AuthProvider — bootstrap auth saat app mount. Pasang di App.tsx sekitar router.
 *
 * Tugas:
 *  1. Pasang gembok app (bootstrapLock) — kalau gembok ON & PIN sudah di-set,
 *     app mulai terkunci (AppLockScreen muncul via ProtectedRoute).
 *  2. Saat device online lagi, cek `authApi.me()` untuk akun aktif → update flag
 *     `revoked` (revoke admin efektif saat online, spec § C).
 *  3. Kunci ulang saat tab kembali fokus setelah lama idle (opsional, hardening
 *     gembok device lapangan).
 *
 * TIDAK menarik data domain (itu tugas sync engine). Hanya state auth/lock.
 */
import { useEffect, type ReactNode } from 'react';
import { bootstrapLock, useLockStore } from './lock.js';
import { useAuthStore, selectActiveAccount } from './store.js';
import { authApi } from './api.js';

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 1. Pasang gembok sekali saat start.
    bootstrapLock();
  }, []);

  useEffect(() => {
    // 2. Saat online (atau kembali online), verifikasi sesi + status revoke.
    function checkRevoke() {
      const acc = selectActiveAccount(useAuthStore.getState());
      if (!acc || !navigator.onLine) return;
      authApi
        .me()
        .then((me) => {
          useAuthStore.getState().setRevoked(acc.userId, me.revoked);
          useAuthStore.getState().markEnrolled(acc.userId);
          if (me.revoked) {
            // Akun dicabut admin → logout paksa saat online.
            useAuthStore.getState().logout(acc.userId);
          }
        })
        .catch(() => {
          // 401 sudah di-handle interceptor (kunci/logout). Error lain = abaikan.
        });
    }
    checkRevoke();
    window.addEventListener('online', checkRevoke);
    return () => window.removeEventListener('online', checkRevoke);
  }, []);

  useEffect(() => {
    // 3. Re-lock saat tab disembunyikan (hardening device lapangan).
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        useLockStore.getState().lock();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return <>{children}</>;
}
