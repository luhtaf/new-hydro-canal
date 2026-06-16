---
feature: audit
owns: []
uses_models: []
touches_features: ["dashboard", "auth", "layout"]
jobs: []
---

# Fitur: Audit (FE — admin, read-only)

## Apa ini
Halaman `/audit`: timeline jejak aksi (siapa-apa-kapan-target), admin-only. Server-state
murni (bukan PouchDB) — baca dari `GET /audit` via TanStack Query. Port demo
`view-audit` + `renderAudit`, ditambah infinite scroll, filter server-side, grouping
per hari, dan export CSV.

## Isi folder
- `AuditLog.tsx` — page utama (DEFAULT export → route `/audit`). Filter bar
  (search debounce / aksi / rentang tanggal), timeline grouped-by-day dengan heading
  sticky, baris audit (avatar gradient + waktu mono + "user · kind → target" + badge
  aksi ring), infinite scroll lewat IntersectionObserver sentinel, skeleton/empty/error
  state, tombol Export CSV.
- `api.ts` — `fetchAudit` (page-based) + `fetchRecentAudit`. Reuse `apiClient` axios
  slice auth (`withCredentials`, interceptor 401→app-lock). JANGAN bikin instance baru.
- `hooks.ts` — `useAuditInfinite` (useInfiniteQuery, getNextPageParam ikut `hasMore`
  server) + `useRecentAudit` (feed dashboard) + `auditKeys`.
- `routes.tsx` — `auditRoutes` lazy (requireRole admin).
- `index.ts` — barrel publik.

## Keterkaitan
- **Activity feed [dashboard]** mengonsumsi `useRecentAudit(5)` (demo `renderDashboard`
  ambil 5 audit teratas) → impor dari barrel ini, bukan panggil API langsung.
- **Penulisan audit = BE** (`shared/middleware/audit` di slice mutasi). FE hanya baca;
  tak ada mutation di sini.
- Avatar/initials di-derive dari `AuditLog.userInitials`/`userName` (denormalized server)
  — tak butuh fetch User. Ubah denormalisasi di model → cek mapping `initials()`.
- Enum aksi (`AuditAction` di shared/types) → `ACTION_META` di page (ikon+tone+label).
  Tambah aksi baru di shared/types → tambah entri di `ACTION_META` (kalau tidak,
  fallback ikon `Activity` + tone slate).
- Route `/audit` sudah ada placeholder di `router.tsx` (RequireAdmin) — verify wiring
  ganti elemen placeholder dgn `auditRoutes`/komponen. Sidebar entry sudah di nav-config.

## Jobs/Cron
—

## Aturan domain
Audit tak menyentuh aturan domain QC. Visual = ground-truth demo `view-audit` +
checklist "Demo subset" PLAN-FE (dark mode/empty-state dipertahankan; kelas
`.empty-state`/`.input`/`.btn` dari globals.css). Acuan endpoint: PLAN-BE "Audit".
