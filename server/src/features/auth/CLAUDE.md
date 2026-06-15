---
feature: auth
owns: []
uses_models: [User]
touches_features: [sync, canal, penugasan, qc, audit, user, reports]
jobs: []
---

# Fitur: Auth (BE)

## Apa ini
Session login multi-akun untuk new-hydro-canal: `POST /auth/login` (email/usv + PIN)
→ session cookie (express-session + connect-mongo). Plus `/auth/me`, `/auth/logout`,
`/auth/change-pin`, dan `/auth/revoke` (admin nonaktifkan akun). PIN di-hash bcrypt
(cost 12), login di-rate-limit. Acuan: spec § C (auth multi-akun, no token akrobat).

## Isi folder
- `auth.routes.ts` — router `/auth/*`, di-mount via `features/index.ts`.
- `auth.controller.ts` — handler HTTP tipis: validasi zod + urus sesi (regenerate/destroy).
- `auth.service.ts` — logika murni: verifikasi PIN, ganti PIN, revoke, `toPublicUser`.
- `loginRateLimit.ts` — limiter login in-memory (5 attempt / IP / 15 menit), no dep baru.

## Keterkaitan
- Implementasi `requireAuth` + `requireRole` ada di **`shared/middleware/auth.ts`**
  (shared, dipakai >=2 fitur). Ubah shape sesi di `shared/middleware/session.d.ts`
  → efek ke SEMUA fitur yang baca `req.session.user` / `getAuthUser`.
- `req.session.user.tokenVersion` snapshot saat login; `requireAuth` bandingkan vs DB.
  Ubah field `tokenVersion`/`revoked` di User → efek ke gating semua route auth.
- Revoke menaikkan `tokenVersion` → sesi lama akun itu ditolak saat device online lagi
  → efek ke [sync] (push ditolak 401 → client re-login).
- MULTI-AKUN: server stateless soal device. 1 akun = 1 sesi/cookie. Switch akun di
  device = ganti cookie sesi, BUKAN urusan server.

## Jobs/Cron
Ref `server/src/jobs/INDEX.md`. — (tidak punya job).

## Aturan domain
- Spec § C: identity utama = email; `idpSubject` disisakan kosong untuk bolt-on SSO.
  USV ikut data assignment, BUKAN identitas (tapi boleh dipakai sebagai login identifier).
- PIN 4-6 digit, bcrypt cost 12 (security checklist PLAN-BE.md).
- Rate-limit login 5x/15mnt (security checklist PLAN-BE.md).
