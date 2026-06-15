---
feature: notification
owns: []
uses_models: ["Notification"]
touches_features: ["undangan", "penugasan", "sync", "layout"]
jobs: []
---

# Fitur: Notification (BE)

## Apa ini
Inbox notif PER USER: baca daftar notif (terbaru dulu) + hitungan unread, tandai
dibaca per item / semua. Plus `createForUser` sebagai SATU-SATUNYA jalur produksi
notif baru — fitur lain ([undangan]/[penugasan]/[sync]) memanggilnya, bukan
`Notification.create` langsung, supaya default (color/icon/ts) konsisten.

## Isi folder
- `notification.routes.ts` — `GET /notifications/mine`, `POST /notifications/read-all`,
  `POST /notifications/:id/read` (auth, ter-scope user sesi). Mount `/notifications`
  via features/index.ts. `/read-all` didaftarkan SEBELUM `/:id/read` (hindari salah match).
- `notification.controller.ts` — zod validate → service → json. `getAuthUser` ambil userId sesi.
- `notification.service.ts` — `listMine` (find + countDocuments unread), `markRead`
  (findOneAndUpdate guarded by userId), `markAllRead` (updateMany), `createForUser`
  (jalur tulis untuk fitur lain). `toDto` normalkan ObjectId/Date → string/ISO.

## Keterkaitan
- **Model `Notification` MILIK [shared-models]** — slice ini hanya memakai. Ubah shape
  `Notification` di shared/types.ts (kind/color/icon) → cek `toDto` + enum di model.
- **`createForUser` dipanggil [undangan] (undangan baru), [penugasan] (assign), [sync]
  (konflik/sync sukses), [pengukuran] (threshold diubah)** — kalau ubah signature, cek
  pemanggil. Sampai pemanggil ada, notif di-seed via seed/manual.
- **Bentuk respons `mine` ({ items, unread }) dibaca FE [notifikasi]** (NotifInbox +
  badge sidebar + tab title). Ubah field → sinkron `client/src/features/notifikasi`.
- **`unread` count** = sumber badge sidebar Notifikasi + `document.title` di FE.

## Jobs/Cron
— (tidak punya job). Pruning notif lama bisa TTL index di model (owner shared-models),
bukan cron di sini.

## Aturan domain
Notif tidak menyentuh aturan domain (final depth/deadline/filename). Murni infrastruktur
komunikasi. `kind`/`color` enum sinkron dengan `NotificationKind`/`NotificationColor`
di shared/types.ts.
