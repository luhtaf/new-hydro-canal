---
feature: pengukuran
owns: ["Pengukuran"]               # model shared, logika CRUD owner = fitur ini
uses_models: ["Pengukuran"]
touches_features: ["qc", "reports"]
jobs: []
---

# Fitur: Pengukuran (Threshold)

## Apa ini
CRUD threshold singleton (lulus / toleransi / tidakLulus) yang menentukan warna
PASS/TOLERANCE/NOT-PASS pada hasil kedalaman. NB nama legacy: "Pengukuran" = data
THRESHOLD, BUKAN pengukuran lapangan. Di-port dari app lama + GATING admin baru.

## Isi folder
- `pengukuran.routes.ts` — GET publik-auth · POST/PATCH/DELETE admin-only (gating BARU).
- `pengukuran.controller.ts` — validasi zod + delegasi service.
- `pengukuran.service.ts` — CRUD singleton atas model shared `Pengukuran`.

## Keterkaitan
- Model `Pengukuran` ada di `shared/models/Pengukuran.ts` (dipakai >=2 fitur) — fitur ini owner CRUD.
- Ubah angka threshold di sini → efek ke [qc]/[chart] (klasifikasi warna depth, FE drag chart + BE PNG export) + [reports] (breakdown pass/tol/fail).
- Singleton: praktiknya 1 dokumen; POST tolak (409) kalau sudah ada → pakai PATCH.

## Jobs/Cron
— (lihat `server/src/jobs/INDEX.md`)

## Aturan domain
- DOMAIN.md poin 5 — klasifikasi warna: `depth >= lulus` hijau, `batasAwal <= depth < batasAkhir` kuning, `depth < tidakLulus` merah. Hanya admin boleh edit.
- PLAN-BE.md "Pengukuran" — port persis schema, tetap singleton; gating admin BARU (app lama tak ada).
