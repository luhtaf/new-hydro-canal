---
feature: shared-domain
owns: []
uses_models: []
touches_features: ["qc", "penugasan", "undangan", "peta", "sync", "chart-export"]
jobs: []
---

# Fitur: Shared Domain Helpers

## Apa ini
Helper murni (pure functions, tanpa I/O) untuk aturan domain QC kanal yang dipakai
lintas fitur. Sumber kebenaran logika di `DOMAIN.md`. Identik dengan
`client/src/shared/domain/` (sengaja diduplikat per workspace; kalau ubah satu, ubah
keduanya supaya FE↔BE sinkron).

## Isi folder
- `deadline.ts` — `deadlineInfo(requestDate, now)` → deadline = req + 4 hari, label + tone (rose/amber/emerald). Port dari demo/app.js.
- `depth.ts` — `finalDepth()` + `reverseDepth()` (drag-edit). Formula `* -1`, WAJIB sinkron FE↔BE.
- `threshold.ts` — `classifyThreshold()` / `thresholdColor()` (pass/tolerance/fail) + konstanta `THRESHOLD_HEX`.
- `shortName.ts` — singkatan kontraktor untuk header chart export. Port dari demo/app.js.
- `splitCanal.ts` — auto-split kanal > 999m jadi segmen 500m (skip STA sambungan).
- `fileName.ts` — `buildFileName()` ([district]-[YYMMDD]-[USV]-[urut][rev][qctype]) + `revInTxt()`.
- `utm.ts` — `utmToLatLng()` / `latLngToUtm()` UTM 48S (EPSG:32748) ⇄ WGS84 via proj4.
- `*.test.ts` — unit test vitest per helper.

## Keterkaitan
- ubah formula `finalDepth`/`reverseDepth` → efek ke [qc] (Chart.js drag) + [chart-export] (chartjs-node-canvas PNG). WAJIB ubah versi client juga.
- ubah `thresholdColor`/`THRESHOLD_HEX` → efek ke [qc] + [chart-export] warna bar.
- ubah `buildFileName`/`revInTxt` → efek ke [qc] (output TXT) + [undangan] (qcOutput).
- ubah `deadlineInfo` tone → efek ke [undangan] + [penugasan] badge.
- ubah `shortName` mapping → efek ke [chart-export] header.
- ubah `utmToLatLng` → efek ke [peta] marker.

## Jobs/Cron
—

## Aturan domain
Ref `DOMAIN.md` poin 1 (deadline), 4 (final depth), 5 (threshold), 6 (split >999m),
7 (file naming), 8 (short name), + section "Koordinat (UTM 48S)".
