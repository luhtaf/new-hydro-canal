---
feature: undangan
owns: []
uses_models: ["Aoi", "Canal", "AuditLog", "Notification", "User"]
touches_features: ["penugasan", "qc", "reports", "sync", "notifikasi"]
jobs: []
---

# Fitur: Undangan / AOI ingestion (BE)

## Apa ini
Owner ingestion AOI: parse Excel "AOI QC Canal USV Notification" → 1 `Aoi` (header)
+ N `Canal` (1 baris Excel = 1 Canal ID dengan Order No SENDIRI — DOMAIN CRITICAL).
Plus query baca: list/detail AOI & filter/detail Canal. Mutasi assign canal BUKAN
di sini (itu slice [penugasan]); slice ini READ canal + OWNER tulis saat import.

## Isi folder
- `aoiParser.ts` — pure transform `Buffer` → `{ header, canals, errors }` (SheetJS). Validasi domain: Order No 10 digit numerik, Measure Point tanpa spasi, kolom REQUIRED, tanggal/angka valid. Baris invalid dilewati & dilaporkan di `errors`.
- `undangan.service.ts` — `importAoi` (parse + saring duplikat orderNo + persist Aoi/Canal + audit "import" + notif admin), `listAois`/`getAoi`, `listCanals` (filter status/district/contractor/q), `getCanalByOrderNo` (+ siblings kontraktor/distrik sama + aoi). Mapper doc→DTO (id string + ISO date).
- `undangan.controller.ts` — adapter HTTP tipis (zod validate → service → json). Parse gagal = 422, no file = 400.
- `undangan.routes.ts` — `POST /aoi/import` (multer memory, 10MB, whitelist xlsx, admin), `GET /aois`, `GET /aois/:id`, `GET /canals`, `GET /canals/:orderNo`.
- `aoiParser.test.ts` — unit vitest (xlsx in-memory, tanpa Mongo): header, mapping, validasi, RE-QC/Done, header hilang.

## Keterkaitan
- Tulis `Canal` di import (orderNo unique) → dibaca [penugasan] (assign/query "penugasan saya"), [qc] (status Done + qcOutput), [reports] (group per AOI/region), [sync] (admin-field status/assignedTo = server-wins). Ubah shape Canal/Aoi → `shared/types.ts` + cek konsumen.
- `importAoi` bikin `AuditLog` action `import` + `Notification` kind `undangan` ke admin → dibaca [audit] + shell [notifikasi].
- Saring duplikat orderNo sebelum `insertMany` (hindari E11000 dari index unique `Canal.orderNo`).
- DeadlineBadge/tone dihitung di FE via `shared/domain/deadline` (BE simpan requestDate saja).

## Jobs/Cron
—

## Aturan domain
- DOMAIN.md CRITICAL (Order No per canal) — 1 baris = 1 Canal, `orderNo` unique.
- DOMAIN.md "AOI" header (Region/Area/Vendor) + kolom baris — divalidasi `aoiParser`.
- DOMAIN.md poin 9 (Measure Point tanpa spasi, Order No format) — validasi parser.
- DOMAIN.md poin 1 (deadline = requestDate + 4 hari) — dihitung di FE, BE simpan requestDate.
