---
feature: data
owns: ["Data", "CanalDataSegment", "DepthPoint"]   # schema nested legacy yang di-CRUD slice ini (shape di shared/types)
uses_models: ["Threshold", "Contractor"]            # threshold (re-color chart) + shortName (header preview)
touches_features: ["sync", "qc", "lapangan", "pengukuran"]
jobs: []
---

# Fitur: Data (FE — port existing admin CRUD)

## Apa ini
Port lengkap page CRUD app lama (`fullstack-hydrocanal-graph`) ke React, di route
`/admin/*`. Entrypoint admin untuk data mentah QC kanal: hierarki nested
**Data (MainData root) → canal_data[] (segment) → data[] (depth point)**. Termasuk
chart drag-edit (Chart.js + dragdata + annotation), bulk Excel page 3 import,
shift-select range, dan preview/export PNG. PLAN-FE menyebutnya "fallback CRUD admin"
— flow normal lapangan lewat `/undangan → /penugasan → /lapangan/*`.

## Isi folder
- `api.ts` — wrapper transport port endpoint polymorphic `:id` existing (`/datas`, `/data/:id`, `/detaildata/:id`, `/datachart/:id`, `/updatechartdata/:id`, `/exportallchart/:id`). Reuse `apiClient` axios dari slice auth.
- `hooks.ts` — TanStack Query (query+mutation) per level + `dataKeys`. Drag-save di `useSaveDragEdit`.
- `depthMath.ts` — jembatan field segment (string) → `shared/domain/depth` + `threshold`. JANGAN duplikat formula.
- `useThreshold.ts` — sumber threshold (SEMENTARA default DOMAIN poin 5; ganti ke slice pengukuran nanti).
- `excelPage3.ts` — parser Excel/CSV page 3 (kedalaman) → `DepthPoint[]` (SheetJS). Port bulk import.
- `useShiftSelect.ts` — checkbox shift-select range (+ `applyShiftSelect` pure untuk test).
- `routes.tsx` — `dataRoutes` lazy RouteObject[] (`/admin/*`, `requireRole: admin`).
- `index.ts` — barrel publik (routes + pages + DepthChart + hooks + depth helper).
- `components/` — `PageShell`, `states` (skeleton/empty/error), `SegmentForm` (field+validate+konversi), `DepthChart` (chart drag/threshold).
- Pages: `MainDataList`, `AddMainData`, `EditMainData`, `DataList` (bulk import + shift-select), `AddData`, `EditData`, `ChartData` (drag), `ChartPreview`, `DetailDataList`, `AddDetailData`, `EditDetailData`, `ChartDetailData`.
- `*.test.ts` — unit vitest (node env): depthMath, excelPage3, shift-select, SegmentForm.

## Keterkaitan
- `DepthChart` di-reuse oleh **[lapangan]** (KedalamanInput) & **[qc]** (output preview) → impor dari barrel, bukan copy.
- Drag-edit di sini commit langsung API (jalur admin online). Flow operator offline-first nulis PouchDB dulu → diserap **[sync]**; toast sengaja pakai bahasa "antrian sync" untuk konsistensi UX.
- Formula final depth & threshold dari **shared/domain** (sinkron BE). Ubah formula → ubah `server/src/shared/domain` juga (DOMAIN.md poin 4/5), JANGAN edit di `depthMath.ts`.
- `useThreshold` sementara default; saat **[pengukuran]** slice ada, ganti isinya → konsumen chart tidak berubah.
- `shortName`/`buildFileName` (preview header) dari shared/domain → sinkron header chart PNG **[qc]** / chart-export BE.
- Ubah shape `Data/CanalDataSegment/DepthPoint` → update `shared/types.ts` (FE+BE) + cek **[sync]** projection flat→nested (PLAN-BE).

## Jobs/Cron
—

## Aturan domain
- Final depth (poin 4) + reverse drag → `shared/domain/depth` via `depthMath`.
- Threshold re-color (poin 5) → `shared/domain/threshold` + `useThreshold`.
- Auto-split kanal > 999m (poin 6) → badge peringatan di `AddData` via `shared/domain/splitCanal`.
- Output filename (poin 7) + shortName (poin 8) → preview di `ChartPreview`.
- Validasi parameter (poin 9: Order No 10 digit, Measure Point tanpa spasi, max 3 desimal) → `validateSegment`.
