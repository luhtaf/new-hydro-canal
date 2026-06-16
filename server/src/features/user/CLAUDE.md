---
feature: user
owns: []
uses_models: ["User", "AuditLog"]
touches_features: ["auth", "penugasan", "reports", "audit"]
jobs: []
---

# Fitur: User Management (BE — admin only)

## Apa ini
CRUD akun operator/admin (`/users/*`), admin-only. Tambah/edit/nonaktifkan operator,
atur role + USV + status, dan reset PIN. PIN selalu di-hash bcrypt (reuse helper slice
[auth]). DELETE = **soft delete** (set `revoked` + naik `tokenVersion`), bukan hapus
dokumen — jejak penugasan/audit historis tetap utuh. Acuan: PLAN-BE "User management".

## Isi folder
- `user.routes.ts` — router `/users/*` (semua `requireRole('admin')`), di-mount via `features/index.ts`.
- `user.controller.ts` — HTTP tipis: validasi zod + delegasi service + tulis AuditLog (action `edit`).
- `user.service.ts` — logika murni: list/get/create/update/softDelete/resetPin + `deriveInitials` + validasi role↔USV.
- `user.service.test.ts` — unit `deriveInitials` (pure) + integration (mongodb-memory-server, auto-skip kalau dep absen).

## Keterkaitan
- Pakai model SHARED `User` (`shared/models`). Owner CRUD akun = fitur ini; [auth] cuma verifikasi/sesi.
- Reuse `hashPin` + `isValidPin` + tipe `PublicUser` dari [auth] (`auth.service`) → JANGAN duplikat cost bcrypt/regex PIN.
- Soft delete & reset PIN menaikkan `tokenVersion` → efek ke [auth] (`requireAuth` tolak sesi lama saat device online) + [sync] (push 401 → client re-login). Mekanisme sama dgn `revokeUser` [auth].
- Ubah `role`/`usv`/`status` di sini → efek ke [penugasan] (query "penugasan saya" pakai assignedTo/usv) + [reports] (produktivitas per operator) + [auth] (login identifier usv).
- Tiap mutasi tulis `AuditLog` (kind "Tambah/Edit/Nonaktifkan operator", "Reset PIN") → dibaca [audit]/[reports] + dashboard activity feed.
- FE pasangan: `client/src/features/users` (UsersList + UserForm).

## Jobs/Cron
— (lihat `server/src/jobs/INDEX.md`).

## Aturan domain
- Spec § C — akun = orang; identity utama = email (unique). USV ikut data assignment,
  tapi operator WAJIB punya USV (KBN01–05) & admin TIDAK boleh punya USV (di-enforce service).
- PIN 4–6 digit, bcrypt cost 12 (lewat [auth] `hashPin`). Reset PIN admin-override (tanpa PIN lama).
