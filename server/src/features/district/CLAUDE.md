---
feature: district
owns: ["District"]                 # model shared, tapi logika CRUD owner = fitur ini
uses_models: ["District", "Contractor"]
touches_features: ["qc", "reports", "canal"]
jobs: []
---

# Fitur: District

## Apa ini
CRUD master distrik + seeding default. Distrik = area kerja administratif (mis.
`D.SUNGAI_BEYUKU`) dengan kode 4-char (`3C01`) yang jadi prefix output filename QC.
Di-port dari app lama + extend field `regionName` & `contractorId`.

## Isi folder
- `district.routes.ts` — GET auth · POST/PUT/DELETE admin · DELETE polymorphic (`/:id?`).
- `district.controller.ts` — validasi zod + tipis, delegasi ke service.
- `district.service.ts` — CRUD murni (list/create/update/delete) atas model shared `District`.
- `district.seed.ts` — `addAllDefaultDistricts` (PORT existing), idempotent upsert by name.

## Keterkaitan
- Model `District` ada di `shared/models/District.ts` (dipakai >=2 fitur) — fitur ini owner-nya soal CRUD.
- Ubah `districtId` (kode 4-char) di sini → efek ke [qc] (output filename `[district-code]-...`, DOMAIN.md poin 7).
- Tambah/ubah `regionName` → efek ke [reports] (group per-region) + header chart [qc].
- `addAllDefaultDistricts` dipanggil saat Mongo connection open — di-wire di `server/src/index.ts` setelah `connectDb`.

## Jobs/Cron
— (lihat `server/src/jobs/INDEX.md`)

## Aturan domain
- DOMAIN.md poin 7 — output filename pakai `districtId` (kode 4-char).
- PLAN-BE.md "District (extended)" — extend schema lama dengan `regionName` + `contractorId`, bukan replace.
