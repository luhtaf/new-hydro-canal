---
feature: data
owns: []
uses_models: ["Data", "Pengukuran"]
touches_features: ["qc", "sync", "parameter"]
jobs: []
---

# Fitur: Data (PORT existing)

## Apa ini
Port lengkap endpoint CRUD existing app lama (`fullstack-hydrocanal-graph`) ke TS strict.
Mengelola dokumen `Data` nested deep (`Data > canal_data[] > data[]`) lewat pola
**polymorphic `:id`**: satu `:id` bisa menunjuk root / segmen / titik kedalaman.

## Isi folder
- `data.routes.ts` — semua route existing: `/version`, `/alldatas`, `/datas/:id`,
  `/data/:id`, `/detaildata/:id`, `/dataschart/:id`, `/datachart/:id`,
  `/updatechartdata/:id`, `/exportallchart/:id`, `/cleartmp` + DELETE variants
  (`/alldata/:id`, `/alldetaildata/:id`). Path ABSOLUT (di-mount di root) = kompat app lama.
- `data.controller.ts` — adapter HTTP tipis (zod validate → service → json).
- `data.service.ts` — logika port: `resolveId` (polymorphic), CRUD nested pakai
  positional `$` + `arrayFilters`, proyeksi chart (final depth + threshold), dan
  `updateChartData` (REVERSE drag formula).
- `data.models.ts` — getter `dataModel()`/`thresholdModel()` via `mongoose.model(name)`
  (decouple dari slice shared-models yang dibangun paralel; lihat Keterkaitan).
- `export/tmp.ts` — port `ClearTemp` (bersihkan folder tmp PNG/ZIP) + `ensureTmpDir`
  (dipakai slice qc sebelum tulis PNG).
- `data.service.test.ts` — unit: resolusi polymorphic, reverse-drag round-trip, proyeksi.

## Keterkaitan
- **Model `Data` & `Pengukuran` MILIK slice [shared-models]**, bukan slice ini. Slice ini
  hanya MEMAKAI lewat `mongoose.model('Data'|'Pengukuran')`. Kontrak nama model wajib
  sinkron; kalau shared-models meng-export Model dari barrel, ganti getter di
  `data.models.ts` jadi re-export — perilaku sama.
- **`/exportallchart/:id` & `_metaRows` chart PNG** → render aktual milik [qc]
  (chartjs-node-canvas). Slice ini menyediakan PROYEKSI chart-ready (final depth +
  threshold) sebagai handoff; ubah bentuk `ChartSegment`/`ChartPoint` → efek ke [qc].
- **Reverse drag (`updateChartData`)** pakai `shared/domain/depth` (`finalDepth`/
  `reverseDepth`). Ubah formula → WAJIB sinkron FE drag chart + BE (DOMAIN.md poin 4).
- **`Data._id` ditautkan dari `Canal.dataId`** (slice [parameter]/[penugasan]); hapus
  MainData di sini → `Canal.dataId` jadi dangling (handle di slice owner Canal).
- **`export/tmp.ensureTmpDir()`** dipakai [qc] sebelum tulis PNG; `/cleartmp` mengosongkan.

## Jobs/Cron
— (tidak punya job). Kandidat cleanup tmp terjadwal bisa didaftarkan di
`server/src/jobs/INDEX.md` bila perlu, owner = slice ini.

## Aturan domain
- DOMAIN.md poin 4 (final depth + reverse drag) — dipakai di `updateChartData` & proyeksi chart.
- DOMAIN.md poin 5 (threshold) — klasifikasi warna titik (via `shared/domain/threshold`).
- Schema `Data`/`Pengukuran` di-EXTEND, bukan replace (CLAUDE.md root "Jangan dilakukan").
