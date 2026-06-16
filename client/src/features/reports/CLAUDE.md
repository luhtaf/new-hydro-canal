---
feature: reports
owns: []
uses_models: []
touches_features: ["auth", "qc"]
jobs: []
---

# Fitur: Reports (FE — `/reports`, admin-only)

## Apa ini
Halaman Reports & Analytics: ringkasan kualitas QC sekilas pandang untuk admin.
4 KPI + line trend + bar per region + donut pass/tol/fail + tabel produktivitas
operator + period selector 7/30/90. Port demo `view-reports` + `renderReports`.
Read-only/agregasi — konsumen 5 endpoint BE `/reports/*`.

## Isi folder
- `ReportsPage.tsx` — **default export**, page `/reports`. Komposisi header +
  PeriodSelector + Export CSV + KpiCards + grid chart + tabel + donut.
- `api.ts` — wrapper axios (reuse `[auth]` apiClient): `reportsApi.{kpi,trend,
  perRegion,perOperator,breakdown}` + DTO wire (duplikat dari BE reports.types.ts).
- `hooks.ts` — TanStack Query per-period (key `['reports', kind, period]`), staleTime 60s.
- `exportCsv.ts` — REAL export produktivitas operator → Blob CSV + download (demo touch).
- `components/ChartCanvas.tsx` — bridge React⇄Chart.js v4 imperatif (`chart.js/auto`;
  `react-chartjs-2` tidak ada → drive Chart langsung, destroy saat unmount).
- `components/PeriodSelector.tsx` — segmented 7/30/90 (port pill demo).
- `components/KpiCards.tsx` — 4 KPI card + delta vs periode lalu (warna by arah).
- `components/ReportCard.tsx` — kontainer panel putih konsisten.
- `components/TrendChart.tsx` / `RegionChart.tsx` / `BreakdownDonut.tsx` — config
  Chart.js (line / horizontal bar / donut) memoized per data.
- `components/OperatorTable.tsx` — tabel produktivitas + empty-state + skeleton.

## Keterkaitan
- **Kontrak 5 endpoint** = slice **[reports] BE** (`server/.../reports`). DTO di
  `api.ts` HARUS sinkron dgn `reports.types.ts`; ubah satu → ubah dua.
- **Admin-only**: route dibungkus `<RequireAdmin>` di router (lapisan akses URL) +
  sidebar hide via nav-config (data-min-role). Server juga guard requireRole.
- **apiClient** dari **[auth]** (interceptor 401→app-lock). JANGAN bikin axios baru.
- Outcome pass/tol/fail = turunan `Canal` di BE; saat **[qc]** menambah skor real
  per-titik, BE ganti klasifikasi — DTO & komponen FE TIDAK berubah.
- Menambah icon (`trending-up`/`trending-down`/`minus`) di barrel shared `lib/icon.ts`
  (extension barrel yang disahkan, bukan wiring) → dipakai KpiCards.

## Jobs/Cron
—

## Aturan domain
- DOMAIN.md "Status flow" — hanya canal Done dihitung (logika di BE; FE tampilkan apa adanya).
- Pass rate / re-qc = % dari BE; FE TIDAK menghitung ulang (single source = agregasi BE).
- Visual premium (PLAN-FE.md "Demo subset"): pertahankan period pill, real export,
  data-density, palet restrained + aksen brand.
