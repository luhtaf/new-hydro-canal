---
feature: qc
owns: []
uses_models: []
touches_features: [data, penugasan, undangan, pengukuran]
jobs: []
---

# Fitur: QC Processing (FE)

## Apa ini
Halaman `/qc` (QcProcessing) — daftar kartu output QC per canal dengan mini chart
kedalaman, ringkasan pass/tol/fail, link sumber undangan, dan tombol export per format
(TXT / PNG / Excel Page 2&3 / Request PAT CSV / ZPM32) + panel export bulk (ZIP).
Download via Blob. Port demo `view-qc` + `handleExport`. Status canal jadi Done di server
saat export sukses → kartu ke-refresh.

## Isi folder
- `QcProcessing.tsx` — **default export** page (route `/qc`): header + hero engine card + grid kartu output + panel bulk. State busy per tombol + pilihan format bulk.
- `MiniDepthChart.tsx` — sparkline bar kedalaman (div bars) warna threshold. Port demo `renderMiniCharts` dgn data nyata; pakai `depthColor`/`useThreshold` dari slice [data].
- `api.ts` — export endpoint (`/qc/export/{fmt}/:canalId`, `/qc/export/bulk`) responseType blob + `downloadBlob` (port demo) + `listOutputs` (`/qc/outputs`). Reuse `apiClient` axios slice [auth].
- `hooks.ts` — `useQcOutputs` (query) + `useExport`/`useExportBulk` (mutation + toast + invalidate). `FORMAT_LABEL`.
- `index.ts` — barrel publik (default page + MiniDepthChart + hooks + tipe).

## Keterkaitan
- Export sukses → server set `Canal.status=Done` + `qcOutput`; `useExport.onSuccess` invalidate `qcKeys.outputs()` → kartu (status badge + nama file) ter-update. Sumber data sama yang dibaca [penugasan]/[undangan].
- `MiniDepthChart` pakai `depthColor` + `useThreshold` dari **[data]** barrel (DOMAIN.md poin 4/5) — JANGAN duplikat formula/threshold; saat slice [pengukuran] siap, `useThreshold` ganti sumber (konsumen tak berubah).
- Link sumber kartu → route `/undangan/:orderNo` (**[undangan]**). Empty-state CTA → `/penugasan` (**[penugasan]**).
- Tipe `ExportFormat`/`QcOutputCard` mirror BE slice [qc] (`qc.service`/`qc.list`). Ubah format di BE → update di sini.
- `downloadBlob` & `apiClient` (withCredentials + interceptor 401) dari slice [auth].

## Jobs/Cron
— (tidak punya cron).

## Aturan domain
- DOMAIN.md poin 4 (final depth) + 5 (threshold) — warna mini chart via shared/domain (lewat [data]).
- DOMAIN.md poin 7 (output filename) — `qcOutput` ditampilkan di kartu (di-generate server).
- DOMAIN.md poin 8 (short name) — `contractorShort` dari server.
- Demo touches dipertahankan: badge status warna, toast pada export, link sumber, hover lift, empty/loading/error state.
