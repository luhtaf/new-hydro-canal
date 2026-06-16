---
feature: auth
owns: ["AuthStore", "LockStore"]        # state lokal client (Zustand persist), bukan collection server
uses_models: ["User"]                    # shape profil dari shared/types (Role, UsvCode)
touches_features: ["sync", "layout", "settings"]
jobs: []
---

# Fitur: Auth (FE)

## Apa ini
Auth sisi klien new-hydro-canal: login online (enroll/add account), **multi-akun
per-device ala Gmail**, **app-lock PIN/biometrik** (gembok buka-app, ON by default),
role-gating route, dan indikator sync per-akun. Implementasi spec § C.

Prinsip kunci (spec § C): login pertama WAJIB online; sesudahnya stay logged-in
sampai logout eksplisit (no token akrobat). Online = session cookie biasa.

## Isi folder
- `store.ts` — Zustand persist: akun aktif + daftar akun (tiap akun = profil + status sync). Selector `selectActiveAccount/Accounts/EffectiveRole`.
- `lock.ts` — Zustand persist app-lock: PIN di-hash PBKDF2 (Web Crypto), `bootstrapLock`, `biometricAvailable` (WebAuthn).
- `api.ts` — axios client (`withCredentials`) + interceptor 401→kunci app; endpoint `login/logout/me`.
- `hooks.ts` — `useAuth` (akun aktif/daftar), `useRole` (role efektif + `can(min)`).
- `LoginPage.tsx` — form email + USV + PIN (react-hook-form + zod). Port demo `view-login`. `addMode` untuk add-account.
- `ProtectedRoute.tsx` — gate: lock → auth → role. NoAccess port demo view "no-access".
- `RoleSwitcher.tsx` — pill role topnav (port `#role-switcher`), toggle override sesi.
- `AccountSwitcher.tsx` — dropdown multi-akun: switch (offline gating via `enrolled`), add, logout.
- `AppLockScreen.tsx` — overlay set-PIN / unlock (PIN + biometrik).
- `SyncBadge.tsx` — "✅ full sync / ⏳ N belum terkirim" per-akun.
- `AuthProvider.tsx` — bootstrap lock + cek revoke saat online + re-lock saat tab hidden.
- `index.ts` — barrel publik (slice lain impor dari sini).

## Keterkaitan
- Ubah `Account.sync` di sini → di-set oleh **[sync]** via `setSyncState(userId,…)`; jangan tulis dari komponen.
- Tiap akun = PouchDB namespace `hydrocanal-<userId>` → switch akun = **[sync]** re-attach DB (slice auth cuma set `activeUserId`).
- `markEnrolled(userId)` dipanggil **[sync]** setelah `/sync/seed` sukses (menandai boleh switch offline).
- `RoleSwitcher`/`useRole` → nav links & permission di **[layout]** + per-route `requireRole` di router.
- Toggle gembok/biometrik dipakai **[settings]** via `useLockStore`.
- Kontrak login (`LoginPayload`/`AuthProfile`) sinkron dengan slice **be-auth** (`POST /auth/login`, `/auth/me`, `/auth/logout`).

## Jobs/Cron
— (tidak punya cron).

## Aturan domain
- Spec § C (Auth multi-akun) = sumber utama: login online pertama, switch offline kalau enrolled, app-lock ON by default + bisa dimatikan, revoke server efektif saat online, grain identitas = email (idpSubject disisakan kosong untuk SSO).
- USV = stempel sesi lapangan (ikut data assignment), BUKAN identitas — DOMAIN.md.
