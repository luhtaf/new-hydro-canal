---
feature: pengaturan
owns: []
uses_models: ["Pengukuran", "User"]
touches_features: ["data", "qc", "auth", "fe-sync", "konflik"]
jobs: []
---

# Fitur: Pengaturan (FE — `/pengaturan`)

## Apa ini
Halaman pengaturan: tiga section dalam grid 2-kolom. Port demo `view-pengaturan` +
`renderPengaturan`.
1. **Threshold pengukuran** (admin-only; operator read-only/terkunci) — slider "Lulus ≥"
   live + 4 input numeric (lulus/tidakLulus/batasAwal/batasAkhir) + preview legend +
   chart kedalaman contoh yang **re-color realtime** saat threshold digeser. (DOMAIN.md poin 5)
2. **Akun** — profil read-only akun aktif + toggle Sinkron otomatis + toggle Gembok app
   (app-lock) + biometrik.
3. **Penyimpanan lokal** — statistik PouchDB REAL (size/doc count/sync terakhir) +
   tombol Sinkron paksa / Ekspor backup / Reset lokal (confirmDialog).

## Isi folder
- `PengaturanPage.tsx` — **default export**, page `/pengaturan`. Komposisi 3 section.
- `api.ts` — wrapper axios (reuse `[auth]` apiClient): `fetchThreshold`/`saveThreshold`
  (GET/PUT `/pengukuran`, graceful 404→null), mapper legacy `Pengukuran` (nested
  `toleransi`) ⇄ flat `Threshold`, `DEFAULT_THRESHOLD`.
- `hooks.ts` — `useThresholdQuery` (server singleton), `useThresholdEditor` (draft
  lokal untuk slider live + mutation Simpan), `useLocalStats` (allDocs + Storage API
  + meta sync), `useLocalActions` (forceSync/resetLocal), `clampThreshold`.
- `settingsStore.ts` — Zustand persist preferensi app non-threshold (`autoSync`).
- `components/ThresholdSection.tsx` — section threshold + slider + input + chart preview.
- `components/AkunSection.tsx` — section akun + toggle (autoSync, app-lock, biometrik).
- `components/LokalSection.tsx` — section storage + statistik + aksi.
- `components/ThresholdLegend.tsx` — legend warna (THRESHOLD_HEX shared/domain).
- `components/sampleDepth.ts` — data sintetis untuk chart preview (offset 0).
- `components/SectionCard.tsx` / `Toggle.tsx` — primitif UI lokal.
- `routes.tsx` — `pengaturanRoutes` lazy RouteObject[] (`pengaturan`, tanpa role gating).
- `index.ts` — barrel publik (routes + page + settingsStore + threshold helpers/hooks).

## Keterkaitan
- Threshold = singleton legacy `Pengukurans` (kontrak slice BE `pengukuran`; belum tentu
  hidup → api.ts menelan 404, UI fallback `DEFAULT_THRESHOLD`). Begitu endpoint nyala,
  nilai asli otomatis terpakai.
- Chart preview meng-impor `DepthChart` dari **[data]** barrel (re-color via prop
  `threshold`) — jangan copy chart. Ubah `DepthChart` props → cek pemakaian di sini.
- Saat threshold di-Simpan, slice **[qc]**/**[data]** `useThreshold` (sementara default)
  bisa diganti baca dari sini (`useThresholdQuery`) supaya chart QC konsisten. Sumber
  warna = `shared/domain/threshold` (sinkron BE), JANGAN duplikat ambang.
- Toggle **Gembok app** memanggil `useLockStore` milik **[auth]** (`enableLock`/
  `disableLock`/`setBiometricEnabled`) — slice ini cuma konsumen (spec § C). Profil akun
  dibaca dari `useAuth` (read-only di sini; di-edit lewat admin/login online).
- Statistik & aksi storage menyentuh **[fe-sync]**: `getPouch`/`destroyPouch`/`getSyncMeta`
  (pouch.ts) + `syncNow` (sync.ts). Reset lokal = `destroyPouch` → re-seed oleh [fe-sync]
  saat online. Antrian pending dihitung dari prefix `_outbox:` (kontrak [konflik]/[fe-sync]).
- `settingsStore.autoSync` dikonsumsi **[fe-sync]** untuk memutuskan auto-push 30s.

## Jobs/Cron
—

## Aturan domain
- Threshold (DOMAIN.md poin 5): admin-only edit; warna pass/tolerance/fail via
  `shared/domain/threshold` (THRESHOLD_HEX). Slider menggeser `lulus` (ikut `batasAkhir`)
  persis perilaku demo `renderPengaturan`.
- Final depth chart preview (DOMAIN.md poin 4) lewat `[data]` DepthChart/depthMath —
  tidak ada perhitungan depth manual di slice ini.
