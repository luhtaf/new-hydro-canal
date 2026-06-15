---
feature: fe-shell
owns: []                                  # tidak punya model/collection — ini chrome UI
uses_models: []                           # tidak baca data domain langsung
touches_features: [sync, auth, notifikasi, konflik]
jobs: []
---

# Fitur: Shell (layout & chrome global)

## Apa ini
Kerangka aplikasi: TopNav, Sidebar, BottomTabNav (mobile), overlay global
(CommandPalette ⌘K, SyncDrawer, TourOverlay 8-step, ToastStack, confirmDialog),
OfflineBanner, Breadcrumb, SplashScreen, dan RootLayout yang membungkus semua route.
Cross-cutting: dipakai SEMUA fitur (>=2), tidak punya owner fitur → tinggal di `shared/`.

## Isi folder
- `RootLayout.tsx` — komposisi shell + Outlet, pasang shortcut/online listener, auto-tour first visit.
- `TopNav.tsx` — logo+version chip, ⌘K, online toggle, dark toggle, sync badge, live clock, tour, role pill.
- `Sidebar.tsx` — grup uppercase + nav-link active gradient + storage card; drawer di mobile.
- `BottomTabNav.tsx` — 5 tab mobile.
- `CommandPalette.tsx` — ⌘K fuzzy route+action, ↑↓↵/ESC, Portal.
- `TourOverlay.tsx` + `tour-store.ts` — walkthrough 8-step, spotlight, `tourSeen` localStorage.
- `SyncDrawer.tsx` — drawer antrian sinkronisasi + empty state.
- `OfflineBanner.tsx` — banner kuning saat offline.
- `Breadcrumb.tsx` — breadcrumb derive dari path + nav-config.
- `SplashScreen.tsx` — fallback Suspense, suppress di path `viewdata`.
- `ToastStack.tsx` — toast slide-up auto-dismiss 2800ms (Portal).
- `confirm.tsx` — `confirmDialog()` imperatif + `<ConfirmHost/>`.
- `RequireAdmin.tsx` / `NoAccessPage.tsx` — gerbang route admin-only.
- `NotFoundPage.tsx` / `Placeholder.tsx` — fallback `*` + placeholder route belum-diisi.
- `Icon.tsx` — render lucide by kebab-name (jembatan ke `../lib/icon.ts`).
- `nav-config.ts` — SUMBER TUNGGAL navigasi (sidebar grup, bottom tab, route palette).

State terkait (di `../stores/`): `theme.ts` (dark mode), `role.ts` (admin/operator),
`ui.ts` (overlay/queue/toast/online). Hooks (di `../hooks/`): `useShortcuts`,
`useOnline` (+`pingServer`), `useClock`. Icon registry di `../lib/icon.ts`.

## Keterkaitan
- Tambah/ubah route → update `nav-config.ts` (sidebar + bottom + ⌘K ikut otomatis) DAN `router.tsx`.
- Ganti queue source: shell pakai `ui.ts` queue lokal → slice [sync] mengganti dengan derive dari PouchDB outbox (SyncDrawer + OfflineBanner + queue badge baca dari sana).
- `useOnline({ verifyWithPing:true })` diaktifkan [sync] saat endpoint `/sync/ping` hidup; default false di shell (belum ada server).
- Badge konflik di sidebar (`nav-config` badge count) → slice [konflik] ganti angka statis dengan count nyata.
- Notif badge → slice [notifikasi] (tab title + sidebar badge).
- Role pill toggle lokal → slice [auth] menggantinya dengan `useAuth().user.role` (jangan hapus toggle UI, ganti sumbernya).

## Jobs/Cron
— (tidak ada job)

## Aturan domain
Shell tidak menyentuh aturan domain (final depth, deadline, dll). Mengonsumsi tipe
bersama dari `../types.ts`. Visual = ground-truth `demo/` + checklist "Demo subset"
di `PLAN-FE.md` (semua touch wajib hadir: dark mode, ⌘K, tour 8-step, role pill,
offline banner, sync drawer, toast, confirmDialog, live clock, breadcrumb, splash).
