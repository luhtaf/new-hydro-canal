---
feature: users
owns: []
uses_models: ["User"]
touches_features: ["auth", "user", "reports", "audit"]
jobs: []
---

# Fitur: Users (FE — manajemen akun, admin only)

## Apa ini
Halaman admin kelola operator & akun (`/users`): 4 KPI card + tabel operator
(avatar inisial, role badge, USV, status dot, produktivitas bar, terakhir aktif)
+ search/filter role + aksi baris (edit / reset PIN / nonaktifkan) + UserForm modal
tambah/edit. Port demo `view-users` + `renderUsers`. Pasangan BE: slice [user]
(`/users/*`). Jalur admin online (TanStack Query langsung ke API, bukan PouchDB).

## Isi folder
- `UsersList.tsx` — **default export**, page `/`. Header + KPI + tabel + state empty/error/skeleton, orkestrasi modal.
- `UserForm.tsx` — modal tambah/edit (react-hook-form + zod). USV auto-disable saat role admin; PIN awal hanya saat tambah.
- `api.ts` — wrapper transport `/users/*` (reuse `apiClient` [auth]); respons `{ data }` di-unwrap. Tipe `ManagedUser`.
- `hooks.ts` — TanStack Query (list + create/update/delete/reset-pin) + `deriveUsersKpi`. Query key `['users','list']`.
- `routes.tsx` — `usersRoutes` lazy (`/users`, requireRole admin).
- `index.ts` — barrel publik (routes + page + hooks + tipe akun).
- `components/UserKpiCards.tsx` — 4 KPI ringkas (Total operator/Admin/USV/Produktivitas).
- `components/UserRow.tsx` — 1 baris tabel + menu aksi (dropdown klik-luar).
- `components/ResetPinDialog.tsx` — modal admin set PIN baru (override, tanpa PIN lama).

## Keterkaitan
- Konsumsi endpoint slice [user] BE (`/users`). Ubah shape respons di BE → update `ManagedUser` di `api.ts`.
- Reuse `apiClient` [auth] → interceptor 401→app-lock konsisten. Reset PIN / nonaktifkan menaikkan `tokenVersion` server → akun ke-target dipaksa re-login (spec § C).
- Ubah field akun (role/usv/status) → efek ke [reports] (produktivitas per operator) + [auth] (login identifier usv) + [penugasan] (assignedTo).
- Tiap mutasi men-trigger AuditLog di BE → muncul di dashboard activity feed + [audit].
- Tone badge/role pakai kelas Tailwind STATIK (JIT tak baca string dinamis) — JANGAN ganti ke `bg-${x}-50`.

## Jobs/Cron
—

## Aturan domain
- Spec § C — akun = orang; email identitas utama (unique). Operator WAJIB USV (KBN01–05),
  admin TIDAK punya USV (di-enforce form + service BE).
- PIN 4–6 digit (validasi form + BE). Reset PIN = admin override (beda dari change-pin [auth]).
- DELETE = soft delete (server set revoked) — UI sebut "Nonaktifkan", bukan "Hapus".
