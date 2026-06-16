---
feature: lapangan-parameter
owns: []                                     # tidak punya model server; nulis SyncDoc type "parameter" (cikal-bakal CanalDataSegment)
uses_models: ["Canal"]                        # baca assignment (doc canal:<id>) untuk auto-fill
touches_features: ["sync", "lapangan-kedalaman", "data", "penugasan"]
jobs: []
---

# Fitur: Lapangan — Input Parameter (FE)

## Apa ini
Halaman operator isi parameter QC 1 kanal (`/lapangan/parameter/:canalId`), page 2
dari flow lapangan (Penugasan → Parameter → Kedalaman). FE-only, local-first:
auto-fill dari assignment lalu tulis draft ke PouchDB `parameter:<canalId>` lewat
sync engine. Port demo `view-lapangan-parameter` + `attachParameterDateLogic` +
`attachValidators`.

## Isi folder
- `ParameterForm.tsx` — page utama (default export). react-hook-form + zod, 3 section
  (Info kanal / Parameter pengukuran / Tanggal) + sidebar (checklist validasi,
  preview filename, tombol next). Border red/orange/green realtime.
- `schema.ts` — zod schema + `softWarnings` + `maxThreeDecimals`. Aturan validasi
  page 2 (DOMAIN.md poin 9).
- `hooks.ts` — `useAssignment` (baca `canal:<id>`), `useParameterDraft` (baca
  `parameter:<id>`), `useSaveParameter` (tulis lewat `writeDoc`). Helper id doc.
- `components.tsx` — `ValidatedField` (border tone + badge), `SectionCard`,
  `ValidationChecklist`.
- `routes.tsx` — `lapanganParameterRoutes` (lazy, requireRole operator).
- `index.ts` — barrel publik.
- `schema.test.ts` — unit vitest (validasi + clamp + warning).

## Keterkaitan
- Tulis HARUS lewat `useSaveParameter` → `writeDoc` (shared/db/sync) → outbox →
  diserap [sync]. JANGAN `getPouch().put` langsung (bypass outbox = data hilang).
- Doc `parameter:<canalId>` jadi cikal-bakal `CanalDataSegment` (shared/types) saat
  diproyeksikan server [data]/[sync]. Ubah `ParameterDraftPayload` → cek projection
  flat→nested + slice [lapangan-kedalaman] (page 3 baca canalId/panjang yang sama).
- Tombol "Input kedalaman" nav ke `/lapangan/kedalaman/:canalId` ([lapangan-kedalaman]).
- ID kanal + panjang di sini WAJIB = page 3 (DOMAIN.md poin 9) → validasi cross-check
  final di slice kedalaman.
- Auto-fill baca assignment dari [penugasan] (doc `canal:<id>` hasil seed/sync).

## Jobs/Cron
—

## Aturan domain
- Poin 3 (Measure Date clamp ke Finish Date AOI) → `onMeasureDateChange` di
  ParameterForm + toast warning.
- Poin 7 (output filename) → preview via `shared/domain/fileName.buildFileName`.
- Poin 9 (validasi page 2: Order No 10 digit, Operation No default 0010 warning,
  Measure Point tanpa spasi, max 3 desimal, panjang = Σ STA, ID kanal match) →
  `schema.ts`. Sinkron logika dengan `validateSegment` slice [data].
