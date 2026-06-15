---
feature: kalender
owns: []                                  # tidak punya model sendiri (derive dari Canal)
uses_models: ["Canal"]                    # baca AOI per-canal (requestDate/startDate/status) untuk event
touches_features: ["undangan", "penugasan", "dashboard"]
jobs: []
---

# Fitur: Kalender (FE)

## Apa ini
Page `/kalender` (PLAN-FE page 3): month grid + side panel "Detail hari". Klik
tanggal → daftar event hari itu (undangan/penugasan/deadline, color-coded). Port
demo `view-kalender` + `renderCalendar` + `renderDaySidebar`. Toggle Bulan/Minggu/Hari
hadir (Minggu & Hari placeholder post-MVP per PLAN-FE), plus navigasi bulan prev/next
dan tombol "Hari ini".

## Isi folder
- `events.ts` — logika domain pure: `deriveEvents` (Canal[] → CalendarEvent[]),
  `buildMonthEvents` (group per hari + dot dominan), `buildMonthGrid` (grid Mon=0),
  `dayKey`, plus peta tone/label per jenis event. No-React → unit-testable.
- `useCalendarData.ts` — sumber Canal[]. SEMENTARA sample (DOMAIN.md sample data
  digeser ke bulan berjalan); GANTI ke TanStack Query `useCanals()` saat slice
  canal/penugasan/undangan siap (permukaan return tetap).
- `KalenderPage.tsx` — page (default export). Month grid (grid-cal/cal-cell dari
  globals.css), side panel, legenda, view toggle.
- `routes.tsx` — `kalenderRoutes` lazy RouteObject[] (`/kalender`, tanpa role gating).
- `index.ts` — barrel publik (routes + page + helper event).
- `events.test.ts` — unit vitest (deriveEvents, buildMonthEvents, buildMonthGrid).

## Keterkaitan
- Deadline event = `requestDate + 4 hari` lewat `shared/domain/deadline` →
  SINKRON dgn server (DOMAIN.md poin 1). Jangan hitung manual di sini.
- Ubah shape `Canal` (requestDate/startDate/status/usv) di `shared/types.ts` →
  cek `deriveEvents` (field yang dibaca). Field yang dipakai: requestDate, startDate,
  status, usv, canalId, contractor, district, panjang, _id.
- Klik kartu event → navigate `/penugasan/:canalId` (kontrak [penugasan]); klik
  "Tambah" → `/undangan/baru` (kontrak [undangan]). Kalau route itu berubah,
  update di sini.
- `deriveEvents`/`buildMonthEvents` bisa di-reuse [dashboard] untuk "agenda minggu
  ini" → impor dari barrel, jangan copy.
- `useCalendarData` adalah satu-satunya titik ganti saat pindah ke data nyata;
  page & event logic tidak ikut berubah.

## Jobs/Cron
—

## Aturan domain
- Deadline (DOMAIN.md poin 1): `requestDate + 4` via `shared/domain/deadline`.
- Event jenis & warna selaras legenda demo: Undangan=brand, Penugasan=emerald,
  Deadline=rose. Dot tunggal per sel pakai prioritas dl > pen > und.
