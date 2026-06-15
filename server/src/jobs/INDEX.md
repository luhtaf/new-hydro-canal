# Jobs / Cron registry

> Registry tunggal SEMUA cron job di server. Guardrail: tiap job WAJIB terdaftar di sini.
> Fitur yang punya job → tulis di frontmatter `jobs:` CLAUDE.md fitur-nya + daftar di tabel ini.

## Format

| Job ID | Jadwal (cron) | Fitur owner | Fitur tersentuh | Deskripsi |
|---|---|---|---|---|
| _(belum ada)_ | — | — | — | — |

## Aturan

- 1 baris = 1 job. `Job ID` unik, kebab-case.
- `Fitur owner` = folder `features/<x>/` yang punya job (file job-nya tinggal di situ).
- `Fitur tersentuh` = fitur lain yang datanya kena efek job (cross-link).
- Jadwal pakai notasi cron standar; kalau bukan cron (event-driven) tulis pemicunya.

## Kandidat (dari PLAN-BE.md, belum diimplement)

- Backup MongoDB dump daily 3am → S3 (retention 30 hari).
- Audit log TTL cleanup (1 tahun).
- Productivity cache recompute (per operator, harian).
