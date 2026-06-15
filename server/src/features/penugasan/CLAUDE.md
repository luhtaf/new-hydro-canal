---
feature: penugasan
owns: []
uses_models: ["Canal", "Data", "AuditLog", "User"]
touches_features: ["sync", "data", "qc", "canal", "audit", "reports"]
jobs: []
---

# Fitur: Penugasan (BE)

## Apa ini
Layer ops "penugasan" di atas model shared `Canal`: admin meng-assign canal Submitted ke
operator (Submitted → Assigned, bulk), dan operator melihat "penugasan saya" yang
di-group Kontraktor → Distrik (DOMAIN.md poin 2). Plus detail 1 canal + ringkasan
progress dari `Data`.

## Isi folder
- `penugasan.routes.ts` — `POST /canals/assign`, `POST /canals/unassign` (admin), `GET /penugasan/mine?tab`, `GET /penugasan/:canalId` (auth). DI-MOUNT DI ROOT (path absolut lintas-resource) lewat features/index.ts.
- `penugasan.controller.ts` — zod validate → service → json. Tulis `AuditLog` (action `assign`) saat assign/unassign (sementara, sampai middleware audit global ada).
- `penugasan.service.ts` — `assignCanals`/`unassignCanals` (updateMany guarded by status), `listMine` (query + group), `groupPenugasan` (PURE — grouping + chip ringkasan, port `renderPenugasan` demo), `getDetail` (Canal + Data lookup).
- `penugasan.service.test.ts` — unit `groupPenugasan` (grouping/chip/sort) tanpa DB.

## Keterkaitan
- **Model `Canal` MILIK [shared-models]** — slice ini hanya memakai. Ubah field
  `status`/`assignedTo`/`usv`/`assignedAt` di Canal → efek ke query `listMine` di sini.
- **Assign mengubah ADMIN-FIELD (`status`/`assignedTo`/`usv`)** → saat sync, field ini
  **server-wins** (operator offline tidak boleh override) — koordinasi dgn [sync]
  (spec § D "Conflict resolution: server-wins untuk admin-field").
- **`getDetail` lookup `Data` via `Canal.dataId`** (by-name `mongoose.models.Data`,
  decoupled — pola sama `data.models.ts`). Ubah shape `Data.canal_data[]` → cek ringkasan
  progress di sini + [data].
- **`assign`/`unassign` tulis [audit]** — saat middleware audit global jadi, pindahkan
  penulisan AuditLog ke middleware & hapus manual di controller.
- **transisi status di sini** dibaca [qc] (Done + qcOutput) & [reports]. Guard status di
  updateMany sengaja: assign hanya `Submitted`, unassign hanya `Assigned` (jangan tarik
  balik pekerjaan In Progress/Done).

## Jobs/Cron
— (tidak punya job).

## Aturan domain
- DOMAIN.md poin 2 — grouping Kontraktor → Distrik + chip ringkasan (kanal/meter/deadline terdekat).
- DOMAIN.md poin 1 — deadline (`shared/domain/deadline`) dihitung server, dikirim siap-pakai ke FE.
- DOMAIN.md poin 8 — `shortName` kontraktor (`shared/domain/shortName`) untuk chip.
- DOMAIN.md "Status flow" — Submitted → Assigned (assign), reverse (unassign).
