---
feature: konflik
owns: []
uses_models: ["ConflictItem", "SyncDoc", "OutboxOp", "DepthParams"]
touches_features: ["fe-sync", "auth", "lapangan", "qc"]
jobs: []
---

# Fitur: Konflik sinkronisasi + Sync drawer (UI)

## Apa ini
Lapisan UI untuk sync local-first: page `/konflik` (resolusi konflik dua-perangkat)
+ drawer antrian sinkronisasi (slide-in dari kanan). Logika sync/konflik-nya ada di
`shared/db/` (slice `fe-sync`); folder ini cuma presentasi + interaksi. Port dari
demo `view-konflik` + `#sync-drawer`.

## Isi folder
- `KonflikList.tsx` — page /konflik: daftar konflik + resolve (animasi slide-out) +
  info strategi default + empty state.
- `SingleFieldResolver.tsx` — kartu konflik kedalaman: side-by-side radio
  lokal/server + preview final depth (shared/domain/depth.ts).
- `MultiFieldResolver.tsx` — kartu konflik parameter: tabel per-field + dropdown
  lokal/server + "pilih semua".
- `ConflictTrigger.tsx` — tombol "Trigger konflik baru" (DEMO ONLY) → suntik
  ConflictItem ke store sesi (tidak nyentuh Pouch).
- `SyncDrawer.tsx` — drawer antrian (outbox) + "Sinkron sekarang" + empty state.
- `useConflicts.ts` — bridge React ⇄ store konflik (useSyncExternalStore).
- `useSyncQueue.ts` — outbox PouchDB live untuk drawer + badge.

## Keterkaitan
- Resolve konflik → `conflict.resolveSingle/resolveMulti` → `sync.applyResolution`
  (tulis ulang lewat jalur tulis [fe-sync] → push ulang). Ubah resolver di sini
  TIDAK boleh ngubah strategi default (itu di [fe-sync] conflict.ts).
- `useConflictCount()` dipakai badge sidebar "Konflik sync N" (shell/[auth] nav).
- Drawer baca outbox [fe-sync] `subscribeOutbox`; "Sinkron sekarang" = `syncNow()`.
- Open-state drawer di `shared/stores/ui.ts` (`syncDrawerOpen`) — dipicu topnav.

## Jobs/Cron
—

## Aturan domain
- Preview final depth di SingleFieldResolver pakai DOMAIN.md poin 4 via
  `shared/domain/depth.ts`. Jangan hitung manual di komponen.
