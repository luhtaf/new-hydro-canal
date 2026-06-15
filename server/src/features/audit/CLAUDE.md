---
feature: audit
owns: []
uses_models: ["AuditLog", "User"]
touches_features: ["data", "penugasan", "undangan", "pengukuran", "qc", "sync", "reports", "dashboard"]
jobs: []
---

# Fitur: Audit (BE — read-only, admin)

## Apa ini
Endpoint admin untuk MEMBACA jejak aksi (AuditLog): siapa-apa-kapan-target. Read-only.
Penulisan log dilakukan `shared/middleware/audit` yang dipasang slice-slice mutasi —
slice ini hanya query + paginasi + filter.

## Isi folder
- `audit.routes.ts` — `GET /audit` (filter+paginasi) & `GET /audit/recent` (feed dashboard).
  Keduanya `requireAuth` + `requireRole('admin')`. Mount `/audit` via features/index.ts.
- `audit.controller.ts` — validasi query zod (userId 24-hex, action enum, page/limit coerce)
  → service → json.
- `audit.service.ts` — `listAudit` (filter→find+count, sort ts desc, page-based,
  `hasMore` untuk infinite scroll), `recentAudit` (N terbaru), `buildFilter` (exported
  untuk test), `toDTO`.
- `audit.service.test.ts` — unit murni `buildFilter` (date clamp, regex escape, $or).

## Keterkaitan
- **Penulisan AuditLog = `shared/middleware/audit`** (`audit({action,kind,target,detail})`
  membungkus `res.json`, catat saat status < 400; + `logAudit()` imperatif untuk
  jalur non-HTTP spt sync batch). Slice mutasi ([data] drag-edit, [penugasan] assign,
  [undangan] import, [pengukuran] threshold, [qc] export, [sync] resolusi konflik,
  [auth] login) memasang middleware ini → muncul di sini. Ubah enum `AuditAction`
  (shared/types) → efek ke filter di sini + semua call site.
- **`GET /audit/recent`** dikonsumsi activity feed di [dashboard] (demo `renderDashboard`
  ambil 5 audit teratas).
- Model `AuditLog` MILIK [shared-models] (denormalized userName/userInitials, TTL 1thn);
  slice ini cuma membaca via barrel. Ubah shape → update shared/types + model.

## Jobs/Cron
— (tidak punya job). TTL 1 tahun dikelola index Mongo di model AuditLog, bukan cron.

## Aturan domain
Audit tak menyentuh aturan domain QC (final depth/deadline/filename). Hanya jejak
operasional. Acuan endpoint: PLAN-BE.md "Audit (routes/audit.ts) — admin only".
