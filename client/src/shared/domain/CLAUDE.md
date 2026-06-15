---
feature: shared-domain
owns: []
uses_models: []
touches_features: ["qc", "penugasan", "undangan", "peta", "sync", "chart-export"]
jobs: []
---

# Fitur: Shared Domain Helpers (client)

## Apa ini
Mirror identik dari `server/src/shared/domain/`. Helper murni aturan domain QC kanal
yang dipakai lintas fitur FE (Chart.js drag, badge deadline, peta Leaflet, output
filename). Sumber kebenaran logika di `DOMAIN.md`. Kalau ubah satu sisi, ubah sisi
server juga supaya FE↔BE sinkron.

## Isi folder
- `deadline.ts` — `deadlineInfo()` → tone rose/amber/emerald untuk DeadlineBadge.
- `depth.ts` — `finalDepth()` + `reverseDepth()` untuk Chart.js drag-edit.
- `threshold.ts` — `classifyThreshold()` / `thresholdColor()` + `THRESHOLD_HEX`.
- `shortName.ts` — singkatan kontraktor untuk preview chart.
- `splitCanal.ts` — auto-split kanal > 999m.
- `fileName.ts` — `buildFileName()` + `revInTxt()`.
- `utm.ts` — `utmToLatLng()` / `latLngToUtm()` untuk Leaflet (proj4).
- `*.test.ts` — unit test vitest per helper.

## Keterkaitan
Sama dgn server (`server/src/shared/domain/CLAUDE.md`). Perubahan logika di sini WAJIB
disinkronkan ke server: [qc] chart drag/render, [chart-export], [undangan]/[penugasan]
badge, [peta] marker.

## Jobs/Cron
—

## Aturan domain
Ref `DOMAIN.md` poin 1, 4, 5, 6, 7, 8 + section "Koordinat (UTM 48S)".
