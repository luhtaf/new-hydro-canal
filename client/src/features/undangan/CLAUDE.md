---
feature: undangan
owns: []
uses_models: ["Aoi", "Canal"]
touches_features: ["penugasan", "qc", "peta", "reports", "auth", "layout"]
jobs: []
---

# Fitur: Undangan / AOI (FE)

## Apa ini
Page AOI: list canal (header 3-card Region/Area/Vendor + tabel + search/filter + bulk
shift-select), detail canal (semua field AOI + siblings kontraktor/distrik sama +
timeline), wizard buat undangan 4-step (auto-split >999m + validasi realtime), dan
import Excel AOI (admin). Port dari demo `view-undangan` / `-detail` / `-baru`.

## Isi folder
- `api.ts` — transport `apiClient` (auth) ke `/aoi/import`, `/aois`, `/aois/:id`, `/canals`, `/canals/:orderNo`.
- `hooks.ts` — TanStack Query: `useAois`/`useAoi`/`useCanals`/`useCanal` + `useImportAoi` (invalidate `undanganKeys.all`). Search/filter via queryKey.
- `UndanganList.tsx` — header 3-card + toolbar (search debounce 200ms + status pills) + tabel + bulk shift-select + import (admin). Default export.
- `UndanganDetail.tsx` — header status/deadline + 3-card + grid field AOI + siblings + acuan deadline + timeline. Default export.
- `UndanganBaru.tsx` — wizard 4-step (Klien/Kanal/Jadwal/Review) + stepper + sticky ringkasan + auto-split + validasi realtime + preview filename. Default export, admin.
- `components/badges.tsx` — `DeadlineBadge` (shared/domain `deadlineInfo`) + `StatusBadge` (tone per status, pulse "In Progress").
- `components/AoiHeaderCards.tsx` — 3 kartu Region/Area/Vendor (demo touch).
- `components/ImportExcelDialog.tsx` — modal upload xlsx (drop-zone + ringkasan imported/duplikat/error). Portal.
- `components/states.tsx` — skeleton/empty/error slice-local.
- `useShiftSelect.ts` (+ test) — bulk shift-select range (pure `applyShiftSelect` + hook).
- `routes.tsx` — `undanganRoutes` lazy (`/undangan`, `/undangan/baru` admin, `/undangan/:orderNo`).
- `index.ts` — barrel publik.

## Keterkaitan
- READER `Canal`/`Aoi` (slice [undangan]-BE owner ingestion). Ubah shape Canal/Aoi → `shared/types.ts` (FE+BE).
- `DeadlineBadge`/`StatusBadge`/`AoiHeaderCards` di-reuse [penugasan]/[qc] → impor dari barrel, jangan copy.
- Tone deadline & status sinkron `shared/domain/deadline` (ubah formula/tone → cek BE + badge konsumen).
- Auto-split via `shared/domain/splitCanal`; preview filename via `shared/domain/fileName` (sinkron output TXT [qc]).
- `shortName` (header chart preview) via `shared/domain/shortName`.
- Role-gating `/undangan/baru` + tombol import via `useRole` (slice [auth]); route admin via handle.requireRole.
- Mutasi assign canal BUKAN di sini — tombol "Assign petugas" handoff ke slice [penugasan] (POST /canals/assign).

## Jobs/Cron
—

## Aturan domain
- DOMAIN.md CRITICAL (Order No per canal) — 1 baris tabel = 1 Canal.
- DOMAIN.md poin 1 (deadline = req + 4 hari) — `DeadlineBadge`.
- DOMAIN.md poin 6 (auto-split >999m) — wizard badge "N segmen".
- DOMAIN.md poin 7/8 (filename + shortName) — preview wizard.
- DOMAIN.md poin 9 (Order No 10 digit, Operation No 0010, Measure Point tanpa spasi) — validasi wizard.

## Aturan lokal
- VISUAL premium (Linear/Vercel/Stripe): Inter + JetBrains Mono (font-mono untuk ID/order), brand cyan, badge tone restrained, shadow soft. Pertahankan demo touch: 3-card AOI, shift-select, stepper wizard, sticky sidebar, drop-zone import, deadline badge, print (no-print).
