---
feature: lapangan-kedalaman
owns: []                                          # FE-only; tidak punya model server. Doc PouchDB `depth:<canalId>:<sta>` (SyncDoc type='depth')
uses_models: ["Threshold"]                        # threshold (re-color chart/badge) via shared/domain + data/useThreshold
touches_features: ["sync", "data", "qc", "pengukuran", "penugasan"]
jobs: []
---

# Fitur: Lapangan — Input Kedalaman (FE)

## Apa ini
Page lapangan offline-first untuk operator mengisi & koreksi kedalaman 1 kanal
(`/lapangan/kedalaman/:canalId`). Port demo `view-lapangan-kedalaman` + `renderDepth`:
tabel STA editable, DepthChart drag-edit, import multi-CSV/Excel page 3, capture GPS.
Semua tulisan masuk PouchDB sebagai doc `depth:<canalId>:<sta>` → diserap sync engine.

## Isi folder
- `depthDoc.ts` — kontrak doc PouchDB type='depth': `DepthPayload`, `depthDocId`,
  `writeDepth` (SATU JALUR TULIS → shared/db/sync `writeDoc`), `displayedOf` /
  `rawDepthFromFinal` / `statusOf` (delegasi shared/domain, JANGAN duplikat formula).
- `useDepthRows.ts` — hook subscribe live semua titik 1 kanal (allDocs prefix range
  `depth:<canalId>:*`, urut STA, re-fetch saat change).
- `KedalamanInput.tsx` — page: tabel STA + DepthChart (reuse slice [data]) + DropZone
  + GPS. Default export untuk lazy route.
- `routes.tsx` — `lapanganKedalamanRoutes` (`/lapangan/kedalaman/:canalId`, requireRole operator).
- `index.ts` — barrel (routes + page + helper doc + hook).
- `components/GpsCaptureButton.tsx` — navigator.geolocation + toast.
- `components/DropZoneCSV.tsx` — drag-drop multi-file; parse via [data] `parsePage3`.
- `depthDoc.test.ts` — unit vitest (murni): id, formula round-trip, status threshold.

## Keterkaitan
- Tulis HANYA lewat `writeDepth` → `shared/db/sync.writeDoc` → outbox → push.
  JANGAN `getPouch().put` langsung (bypass outbox → data hilang offline). Ubah jalur
  tulis sync → cek page ini.
- `DepthChart` & `parsePage3` di-IMPORT dari slice [data] (barrel) — bukan copy.
  Ubah signature DepthChart/onCommit di [data] → page ini ikut.
- Formula final depth + threshold dari `shared/domain` (sinkron BE). Ubah formula →
  ubah `server/src/shared/domain` juga (DOMAIN.md poin 4/5), JANGAN edit di sini.
- Threshold sementara dari [data] `useThreshold` (default); saat [pengukuran] slice
  ada, sumber pindah — konsumen di sini tidak berubah.
- Doc `depth:*` diproyeksikan server (slice [sync] flat→nested) ke schema Data
  ([data]) lalu jadi output [qc]. Ubah shape `DepthPayload` → cek projection [sync] +
  `shared/types.ts` (FE+BE).
- Param non-depth (water_level/tranducer/bed_float/depth_correction) sementara default
  0; nantinya diisi slice parameter page-2 ([penugasan]/lapangan-parameter).

## Jobs/Cron
—

## Aturan domain
- Final depth + reverse drag (DOMAIN.md poin 4) → `shared/domain/depth` via `depthDoc`.
- Threshold re-color/status (poin 5) → `shared/domain/threshold` + `useThreshold`.
- Validasi 3 desimal depth (poin 9) → `round: 3` di DepthChart dragdata + input step.
- Multi-Excel page 3 import (FEEDBACK 2025-12-18) → `DropZoneCSV` + `parsePage3`.
