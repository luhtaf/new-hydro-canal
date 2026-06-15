---
feature: sync
owns: ["SyncCursor", "SyncDocMeta"]
uses_models: ["Data", "Canal", "District", "Contractor", "Pengukuran"]
touches_features: ["data", "canal", "penugasan", "parameter", "qc", "auth", "konflik"]
jobs: []
---

# Fitur: Sync (local-first PouchDB ⇄ Mongo)

## Apa ini
Engine sync custom-REST yang memindahkan doc kecil flat dari PouchDB klien ke Mongo
dan sebaliknya. SATU jalur tulis (spec § D): UI hanya tulis ke PouchDB, slice ini
satu-satunya yang memproyeksikan flat → `Data` nested di server. Online/offline jadi
invisible buat logika app.

## Isi folder
- `sync.routes.ts` — `POST /sync/push`, `GET /sync/pull?since=`, `POST /sync/seed` (semua `requireAuth`).
- `sync.controller.ts` — validasi zod + ambil `userId` dari session + delegasi ke service.
- `sync.service.ts` — orkestrasi push (idempotent, per-doc conflict), pull (since cursor), seed.
- `projection.ts` — flat (`parameter:<canalId>`, `depth:<canalId>:<sta>`) ⇄ `Data` nested; clamp Measure Date.
- `conflict.ts` — strategi: LWW parameter, manual kedalaman, server-wins admin-field.
- `models.ts` — akses model shared by-name (lazy, tak meng-author model slice lain) + `SyncCursor` & `SyncDocMeta` (di-own sini). `SyncDocMeta` simpan `updatedAt` **per-flat-doc** (`docId`, + `canalId` untuk grouping) karena model legacy `Data` sengaja tanpa `timestamps`. Granularity per-doc WAJIB: kalau per-canal, depth titik baru salah dinilai konflik dalam batch yang sama (silent data-loss).
- `sync.test.ts` — integration (mongo-memory-server): push/pull/idempotency/conflict + unit projection/conflict.

## Keterkaitan
- Ubah format `_id` flat / projection di `projection.ts` → efek ke [data] (schema `Data` nested) + klien PouchDB (slice FE sync) → harus sinkron.
- Ubah strategi di `conflict.ts` (mis. depth jadi LWW) → efek ke [konflik] (UI `/konflik`) + integritas data kedalaman.
- `pull`/`seed` filter `Canal.assignedTo` → efek ke [penugasan] (scope "penugasan saya") + [auth] (session.userId).
- `pushDocs` set `Canal.dataId` saat Data baru dibuat → efek ke [canal] (link outcome) + [qc] (lookup Data untuk export). `Canal.status/assignedTo` = admin-field → server-wins, operator tak bisa override via sync.
- Model `Data/Canal/District/Contractor/Pengukuran` di-own slice lain; sync IMPORT lewat `getModel(name)` (guardrail #1). Kalau owner belum mount, `getModel` throw jelas.

## Jobs/Cron
Ref `server/src/jobs/INDEX.md`. Tidak punya job (push/pull dipicu klien). "—".

## Aturan domain
- DOMAIN.md poin 3 (Measure Date clamp ke Finish Date) — diterapkan di `projection.clampMeasureDate`.
- DOMAIN.md poin 4 (final depth) — sync simpan `raw_depth`; formula dipakai saat render/export (slice qc), bukan di sini.
- Spec § D (conflict resolution) — tabel strategi diimplement di `conflict.strategyFor`/`decide`.
