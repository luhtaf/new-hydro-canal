---
feature: shared-models
owns: ["Data", "Pengukuran", "District", "Contractor", "User", "Aoi", "Canal", "AuditLog", "Notification"]
uses_models: []
touches_features: ["auth", "aoi", "penugasan", "canal", "qc", "data", "sync", "district", "pengukuran", "reports", "audit", "notifikasi"]
jobs: []
---

# Fitur: Shared Models (lapisan persistensi shared)

## Apa ini
Definisi Mongoose schema + model untuk SEMUA entitas lintas-fitur. Ini bukan fitur produk,
tapi cross-cutting layer: model masuk sini HANYA kalau dipakai >=2 fitur DAN tak ada owner
tunggal (guardrail global #1). Schema = source of truth bentuk data di Mongo.

## Isi folder
- `Data.ts` — existing nested (Data > canal_data[] > data[]), collection legacy `datas`. Extend: `measure_date`, `region`, `coord_x/y` (optional, backward compatible). Ejaan legacy `lattitude`/`tranducer` dipertahankan.
- `Pengukuran.ts` — singleton threshold (lulus/toleransi/tidakLulus), collection legacy `pengukurans`. Hanya admin yang edit.
- `District.ts` — existing extend: `regionName` + `contractorId` baru. `districtId` = kode 4-char untuk filename.
- `Contractor.ts` — mapping `fullName` → `shortName` (header chart export).
- `User.ts` — akun = orang. `pinHash` select:false, `idpSubject` kosong untuk SSO bolt-on, `tokenVersion`/`revoked` untuk revoke. Export sebagai `UserModel`.
- `Aoi.ts` — header 1 file Excel AOI. 1 Aoi → banyak Canal.
- `Canal.ts` — 1 row Excel = 1 Canal ID dengan Order No SENDIRI (DOMAIN CRITICAL). Index: `orderNo` unique, `{assignedTo,status}`, `{contractor,district}`, `{status,requestDate}`, `{aoiId}`.
- `AuditLog.ts` — jejak aksi, user denormalized, TTL 1 tahun.
- `Notification.ts` — notif per user.
- `index.ts` — barrel export semua model + DocType.
- `seeds/` — `districts.txt` (`NAMA|KODE`), `contractors.json`, `seed.ts` (seedDistricts/seedContractors/seedDefaultAdmin/seedAll, semua idempotent upsert).
- `models.test.ts` — registrasi model, nama collection legacy, index Canal, field extend Data, format seed file (tanpa live Mongo).

## Keterkaitan
- Ubah schema `Canal` (status/assignedTo) → efek ke [penugasan] (query "penugasan saya") + [sync] (admin-field = server-wins) + [qc].
- Ubah field extend `Data` (measure_date/coord) → efek ke [sync] (projection flat→nested) + [qc/chart] (export PNG) + [data] (CRUD).
- Ubah nama model (`mongoose.model('X')`) → efek ke [data]/[sync] yang akses via `mongoose.models.X` by-name (decoupled). Nama HARUS stabil.
- Ubah `districtId` / `Contractor.shortName` → efek ke [qc] (output filename + chart header).
- Tambah model baru di sini → tambah export di `index.ts` + perbarui `owns`/`touches_features` di frontmatter ini (guardrail #2).

## Jobs/Cron
— (tidak punya job). TTL index AuditLog dikelola Mongo, bukan cron.

## Aturan domain
- DOMAIN.md poin 4 (final depth) — field sumber ada di `Data.canal_data[]` (water_level/tranducer/bed_float/depth_correction/depth). Formula di shared/domain, BUKAN di model.
- DOMAIN.md poin 5 (threshold) — schema `Pengukuran`.
- DOMAIN.md poin 7 (filename) — `District.districtId` (4-char).
- DOMAIN.md poin 8 (short name) — `Contractor.shortName`.
- DOMAIN.md "CRITICAL" (Order No per canal) — `Canal.orderNo` unique.

## Aturan lokal
- JANGAN `import { models } from 'mongoose'` — di runtime ESM (mongoose 7 CJS) named export `models` TIDAK ada. Pakai `import mongoose from 'mongoose'` → `mongoose.models.X` untuk guard OverwriteModelError.
- JANGAN koreksi ejaan legacy `lattitude`/`tranducer` (breaking vs data lama).
- JANGAN ganti `collection:` name untuk Data/Pengukuran/District (kompat data lama).
- Model BARU yang punya owner fitur jelas → JANGAN taruh di sini, taruh di folder fitur.
