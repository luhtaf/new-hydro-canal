---
feature: penugasan
owns: []
uses_models: []
touches_features: ["auth", "undangan", "lapangan", "qc", "peta", "sync"]
jobs: []
---

# Fitur: Penugasan (FE)

## Apa ini
Halaman "Penugasan Saya" operator: daftar kanal yang di-assign admin, di-group
Kontraktor → Distrik → CanalCard dengan chip ringkasan (jumlah kanal · total meter ·
deadline terdekat), plus halaman detail 1 kanal (info grid + mini-map Leaflet + progress
Parameter→Kedalaman→QC + tautan "Dari undangan"). Port `view-penugasan` &
`view-penugasan-detail` demo (`renderPenugasan`/`renderPenugasanDetail`).

## Isi folder
- `api.ts` — wrapper transport (`/penugasan/mine?tab`, `/penugasan/:canalId`, `/canals/assign`, `/canals/unassign`). Reuse `apiClient` axios slice auth. Bentuk respons mirror server (deadline/chip dihitung server).
- `hooks.ts` — TanStack Query (`useMinePenugasan`, `usePenugasanDetail`) + mutation assign/unassign (admin). Server-state online, BUKAN PouchDB (penugasan = admin field, server-wins).
- `routes.tsx` — `penugasanRoutes` lazy RouteObject[] (`penugasan`, `penugasan/:canalId`).
- `index.ts` — barrel publik (routes + pages default export + hooks/api).
- `PenugasanList.tsx` — default export. Tab Aktif/Selesai, grouping + chip. Route `/penugasan`.
- `PenugasanDetail.tsx` — default export. Info grid + mini-map + progress + "Dari undangan". Route `/penugasan/:canalId`.
- `components/tone.ts` — peta tone→kelas Tailwind STATIK (anti-purge JIT; jangan `bg-${tone}-50`).
- `components/MiniMap.tsx` — Leaflet 280px, UTM→latlng via `shared/domain/utm`, cleanup `remove()`.

## Keterkaitan
- Bentuk respons SINKRON dgn `server/src/features/penugasan/penugasan.service.ts` — ubah
  shape `PenugasanCanal/Contractor/Detail` di sini → ubah server juga (kontrak wire).
- "Dari undangan" link → **[undangan]** `/undangan/:orderNo` (orderNo = identitas canonical).
- Tombol "Mulai QC" / progress step → **[lapangan]** `/lapangan/parameter|kedalaman/:canalId`.
- "Output" link & progress QC → **[qc]** `/qc`. "Lihat di peta besar" → **[peta]** `/peta`.
- `apiClient` 401 → app-lock interceptor milik **[auth]** (reuse, jangan bikin instance).
- Penugasan dibaca online; **[sync]** server-wins admin-field → tidak ada tulis lokal di sini.
- Tone deadline + shortName kontraktor mengikuti `shared/domain` (server yang hitung) —
  ubah tone mapping → cek `components/tone.ts` (kelas statik) + sisi server.

## Jobs/Cron
—

## Aturan domain
- DOMAIN.md poin 2 — grouping Kontraktor → Distrik + chip ringkasan (port `renderPenugasan`).
- DOMAIN.md poin 1 — badge deadline tone (rose/amber/emerald); nilai dihitung server.
- DOMAIN.md "Koordinat (UTM 48S)" — mini-map convert UTM via `shared/domain/utm` (proj4).
- DOMAIN.md "Status flow" — badge status canal (Submitted/Assigned/In Progress/Done).
