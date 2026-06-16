---
feature: dashboard
owns: []
uses_models: ["AuditLog", "Data"]
touches_features: ["audit", "konflik", "auth", "data", "penugasan", "qc"]
jobs: []
---

# Fitur: Dashboard (FE — home `/`)

## Apa ini
Halaman beranda (route index `/`): ringkasan ops sekilas pandang. 4 KPI + daftar
penugasan minggu ini + status QC terbaru + live activity feed + jam hidup. Port
demo `view-dashboard` + `renderDashboard`. Read-only/agregasi — tidak menulis data.

## Isi folder
- `DashboardPage.tsx` — **default export**, page `/`. Komposisi header (sapaan +
  LiveClock) + 4 StatCard + WeekTasks/RecentQc + LiveActivity.
- `api.ts` — wrapper axios (reuse `[auth]` apiClient): `fetchRecentAudit` (/audit/recent,
  graceful 404→[]), `fetchDashboardData` (/alldatas).
- `hooks.ts` — TanStack Query: `useRecentActivity` (polling 30s), `useDashboardDerived`
  (derive KPI undangan/penugasan/QC + 3 QC terbaru dari /alldatas, memoized).
- `components/LiveClock.tsx` — `useLiveClock` (tick 1s, locale id-ID) + chip jam.
- `components/StatCard.tsx` — kartu KPI (`.stat-card`, badge/icon, tabular-nums).
- `components/LiveActivity.tsx` — feed audit (avatar inisial, waktu relatif, dot-pulse).
- `components/WeekTasks.tsx` — `WeekTasks` (penugasan + deadline badge) + `RecentQc` (3 QC).

## Keterkaitan
- `/audit/recent` = kontrak slice **[audit]** BE (belum tentu hidup saat ini → api.ts
  menelan 404, feed tampil empty). Begitu endpoint nyala, feed otomatis terisi.
- KPI "Antrian sync" = count outbox PouchDB lokal via `useSyncQueue` (**[konflik]**),
  BUKAN network. Ubah sumber outbox di [konflik] → angka ikut.
- KPI undangan/penugasan/QC sementara derive dari `/alldatas` (port **[data]**).
  Saat **[penugasan]**/**[qc]**/**[pengukuran]** slice hidup, ganti sumber query +
  `classifySegment` ke threshold real — komponen StatCard/WeekTasks tidak berubah.
- Sapaan pakai `account.name` dari **[auth]**; aksi "Undangan baru" admin-only via `useRole`.
- Link keluar: `/penugasan`, `/penugasan/:canalId`, `/qc`, `/undangan/baru`.

## Jobs/Cron
—

## Aturan domain
- Badge deadline di WeekTasks → `shared/domain/deadline` (DOMAIN.md poin 1: requestDate
  + 4 hari). Jangan hitung manual.
- QC pass-rate sementara heuristik (proxy rata-rata depth); aturan threshold asli
  DOMAIN.md poin 5 → ganti `classifySegment` ke `shared/domain/threshold` saat
  [pengukuran] menyediakan Threshold per-region.
