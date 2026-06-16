---
feature: notifikasi
owns: []
uses_models: []
touches_features: ["layout", "notification", "auth"]
jobs: []
---

# Fitur: Notifikasi (FE)

## Apa ini
Page `/notifikasi` (PLAN-FE page 16): inbox notif per user. List notif (terbaru dulu),
baris unread di-highlight + dot brand, tandai dibaca per item (hover) / semua (header),
plus penyiaran jumlah unread ke chrome global: badge sidebar "Notifikasi" + tab title
`document.title`. Port `view-notifikasi` + `renderNotifikasi` + `updateTitleBadge` demo.

## Isi folder
- `api.ts` — transport `/notifications/mine|:id/read|read-all`. Reuse `apiClient` axios slice auth.
- `hooks.ts` — TanStack Query: `useInbox` (refetchInterval 60s), `useUnreadCount`
  (selector turunan cache → 1 sumber), `useMarkRead`/`useMarkAllRead` (optimistic update
  list + badge sebelum server balas).
- `NotifInbox.tsx` — page (default export). List + skeleton/empty/error state, tombol
  tandai dibaca. Route `/notifikasi`.
- `NotifBadge.tsx` — komponen headless (return null): set `document.title` + inject/segarkan
  badge counter di nav-link sidebar via DOM (shell bersama tak boleh disentuh). Dipasang
  oleh NotifInbox; idempoten + cleanup saat unmount.
- `components/tone.ts` — peta warna notif → kelas Tailwind STATIK (anti-purge JIT) +
  resolver nama-ikon-kebab → komponen lucide.
- `relativeTime.ts` — format waktu relatif ID (mengganti string statis demo). Pure.
- `routes.tsx` — `notifikasiRoutes` lazy RouteObject[] (`/notifikasi`, tanpa role gating).
- `index.ts` — barrel publik (routes + page + badge + hooks/selector).
- `relativeTime.test.ts` — unit vitest format waktu.

## Keterkaitan
- Bentuk respons SINKRON dgn `server/src/features/notification/notification.service.ts`
  (`InboxResult { items, unread }` + `Notification` DTO). Ubah shape → ubah dua sisi.
- **Badge sidebar**: NotifBadge meng-inject ke `a[href="/notifikasi"]` karena
  `shared/layout/Sidebar.tsx` + `nav-config.ts` (badge statik) DI LUAR slice ini. Saat
  [layout] menyediakan slot badge data-driven, ganti DOM injection → Sidebar konsumsi
  `useUnreadCount` dan hapus injeksi di sini.
- **Tab title** (`document.title`) = demo touch "tab badge unread" (PLAN-FE Demo subset).
- `apiClient` 401 → app-lock interceptor milik **[auth]** (reuse instance, jangan bikin baru).
- Notif baru DIBUAT server oleh **[undangan]/[penugasan]/[sync]/[pengukuran]** via
  `notification.service.createForUser`; slice FE ini hanya baca + tandai dibaca.

## Jobs/Cron
—

## Aturan domain
Tidak menyentuh aturan domain (final depth/deadline/filename). `color`/`kind` enum
sinkron `NotificationColor`/`NotificationKind` di shared/types.ts. Warna ikon selaras
demo: undangan/penugasan=brand, konflik=rose, sync=emerald, threshold=amber.
