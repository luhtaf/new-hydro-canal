---
feature: reports
owns: []
uses_models: ["Canal", "User"]
touches_features: ["qc", "penugasan"]
jobs: []
---

# Fitur: Reports (BE — agregasi analytics)

## Apa ini
Endpoint agregasi Mongo READ-ONLY untuk halaman Reports & Analytics (admin-only).
Menghitung KPI pass rate, trend, distribusi per region/operator, dan breakdown
kualitas dari koleksi `canals` (+ join kecil ke `users`). Tidak menulis apa pun.

## Isi folder
- `reports.routes.ts` — 5 GET admin-only (`/kpi`, `/trend`, `/per-region`,
  `/per-operator`, `/breakdown`). Mount `/reports` via features/index.ts.
- `reports.controller.ts` — adapter HTTP tipis: validasi query zod (period 7/30/90,
  groupBy day/week) → service → json.
- `reports.service.ts` — agregasi `$match status:Done + updatedAt` → `$group`.
  Klasifikasi outcome via `OUTCOME_EXPR` ($switch) di SATU tempat.
- `reports.math.ts` — helper murni (`pct`/`round1`/`windows`) — testable tanpa Mongo.
- `reports.models.ts` — getter `canalModel()`/`userModel()` via `mongoose.model(name)`
  (decouple dari slice shared-models yang dibangun paralel; pola sama data.models.ts).
- `reports.types.ts` — DTO wire (ReportKpi/TrendPoint/RegionStat/OperatorStat/
  QualityBreakdown). Diduplikat di FE `client/.../reports/api.ts`.
- `reports.math.test.ts` — unit math (pembagian-nol, pembulatan, window periode).

## Keterkaitan
- **Sumber kebenaran = `Canal`** (slice [shared-models]); reports cuma BACA via
  `mongoose.model('Canal')`. Ubah field outcome di Canal (mis. nanti slice [qc]
  menambah skor per-titik) → update `OUTCOME_EXPR` di service; DTO/FE tak berubah.
- **Window waktu pakai `Canal.updatedAt`** sebagai proxy "kapan QC selesai" + status
  `'Done'`. Kalau [qc] menambah `qcCompletedAt` eksplisit → ganti field $match.
- **avgHours** = `updatedAt - assignedAt` (jam); bergantung [penugasan] mengisi
  `assignedAt`. Canal tanpa `assignedAt` di-skip dari rata-rata (tidak bias nol).
- **per-region** sementara group by `Canal.contractor` (belum ada field region di
  Canal). Saat field region eksplisit ada, ganti `_id` di pipeline getPerRegion.
- **per-operator** join `users` (name/initials/usv) by `assignedTo`.

## Jobs/Cron
— (tidak punya job). Agregasi dihitung on-demand per request.

## Aturan domain
- DOMAIN.md "Status flow" — hanya canal `status:'Done'` dihitung sebagai QC selesai.
- DOMAIN.md poin (RE-QC) — RE-QC diklasifikasi `tolerance` di OUTCOME_EXPR.
- Admin-only (PLAN-BE.md: analytics = admin) — guard requireRole('admin') di routes.
