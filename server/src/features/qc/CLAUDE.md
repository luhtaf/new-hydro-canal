---
feature: qc
owns: []
uses_models: [Canal, Data, Pengukuran, User, District, Contractor]
touches_features: [data, penugasan, undangan, sync]
jobs: []
---

# Fitur: QC Export (BE)

## Apa ini
Render & export hasil QC 1 canal ke berbagai format: PNG chart (chartjs-node-canvas),
TXT (format akhir slide-4 pptx), Excel Page 2 (parameter) & Page 3 (kedalaman), Request
PAT (CSV UTM), ZPM32 (Excel upload klien), + bulk ZIP (archiver). Saat export sukses,
status Canal → `Done` & `qcOutput` diisi nama file (DOMAIN.md poin 7). Mount di `/qc`.

## Isi folder
- `qc.routes.ts` — endpoint `POST /qc/export/{png|txt|page2-xlsx|page3-xlsx|pat-csv|zpm32}/:canalId`, `POST /qc/export/bulk`, `GET /qc/outputs`, `GET /qc/formats`. Semua requireAuth.
- `qc.controller.ts` — adapter HTTP tipis (zod validate → service → stream attachment). 1 factory `singleExportHandler` per format.
- `qc.service.ts` — orkestrasi: `exportSingle` (load context → generate → markDone), `exportBulk` (ZIP archiver, import dinamis), `EXPORT_FORMATS`.
- `qc.context.ts` — `loadQcContext(canalId)`: resolve Canal + segmen Data (canal_id match) + User + threshold + districtCode + shortName + proyeksi titik (final depth + klasifikasi). Model by-name (decoupled).
- `qc.filename.ts` — `buildQcFileName(ctx, urut)` bungkus `shared/domain/fileName.buildFileName` + `revInTxt`.
- `qc.list.ts` — `listQcOutputs(scope)`: kartu output untuk grid FE (mini chart depths + summary pass/tol/fail). Scope per-role.
- `chart/headerPlugin.ts` — PORT + EXTEND header chart PNG: judul filename, legend threshold, grid meta (Region/Operator/Status QC/USV/Kontraktor short, dll).
- `chart/thresholdLinePlugin.ts` — PORT garis ambang lulus/tidakLulus putus-putus.
- `chart/renderPng.ts` — PORT exportAllChart → 1147x722 PNG buffer, warna bar via threshold.
- `exporters/{txt,xlsx,patCsv,zpm32}.ts` — generator murni per format (input QcContext).
- `exporters.test.ts` — unit format TXT/CSV/filename/xlsx (fixture context, tanpa Mongo).

## Keterkaitan
- Ubah `loadQcContext` shape / segmen-resolve → efek ke SEMUA exporter + `renderPng` + `qc.list`.
- Export sukses set `Canal.status='Done'` + `qcOutput` → efek ke [penugasan]/[undangan] (tampil qcOutput) + [sync] (admin-field status/qcOutput = server-wins; jangan biarkan operator override).
- `renderPng`/warna bar pakai `shared/domain/depth` (finalDepth) + `shared/domain/threshold` → WAJIB sinkron [data] (drag chart) + FE DepthChart (DOMAIN.md poin 4/5). JANGAN ubah formula di sini.
- Filename via `shared/domain/fileName` (poin 7) + shortName via `shared/domain/shortName`/collection Contractor (poin 8) → sinkron [data] ChartPreview + FE.
- Butuh `Canal.dataId` terisi (post-input dari [parameter]/[lapangan]); kalau null → 409.
- PAT CSV keep koordinat UTM apa adanya (DOMAIN.md "Koordinat") — TIDAK convert balik.

## Jobs/Cron
— (tidak punya job). Cleanup tmp PNG terjadwal bisa pakai `data/export/tmp` (owner = slice data).

## Aturan domain
- DOMAIN.md poin 4 (final depth) — proyeksi titik di `qc.context` + warna bar `renderPng`.
- DOMAIN.md poin 5 (threshold) — klasifikasi pass/tol/fail + garis ambang.
- DOMAIN.md poin 7 (output filename + REV di TXT) — `qc.filename`.
- DOMAIN.md poin 8 (contractor short name) — header chart + meta.
- DOMAIN.md "Koordinat (UTM 48S)" — PAT CSV & ZPM32 pakai Easting/Northing.

## Aturan lokal
- `archiver` BELUM di package.json (missingDeps) — di-import dinamis; kalau belum terpasang, bulk balas 501 jelas. Tambah `archiver` + `@types/archiver` sebelum pakai bulk di prod.
- Akses model lewat `mongoose.models.X` by-name (sama [data]) — JANGAN import dari shared/models barrel langsung (hormati boot order).
