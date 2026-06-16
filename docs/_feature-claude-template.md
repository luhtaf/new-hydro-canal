# Template: per-feature CLAUDE.md

> Copy isi blok di bawah ke `features/<fitur>/CLAUDE.md` (BE) atau
> `src/features/<fitur>/CLAUDE.md` (FE) saat bikin slice baru. Hapus baris instruksi ini.
>
> Aturan (guardrail global #3 — earn-the-CLAUDE.md): JANGAN bikin CLAUDE.md seremonial/kosong.
> Kalau folder trivial & tak punya keterkaitan/job → tidak perlu CLAUDE.md.
>
> Frontmatter WAJIB greppable (guardrail #2): kalau ngubah keterkaitan, update frontmatter
> di PR yang sama. Kode = source of truth, file ini = pointer.

---

```markdown
---
feature: <slug>                 # mis. "penugasan"
owns: []                        # model/collection yang fitur ini PUNYA (mis. ["Canal"])
uses_models: []                 # model shared yang DIPAKAI (mis. ["User", "District"])
touches_features: []            # fitur lain yang kena kalau ini diubah (mis. ["sync", "qc"])
jobs: []                        # cron yang dimiliki fitur ini (ref server/src/jobs/INDEX.md)
---

# Fitur: <Nama>

## Apa ini
1–2 kalimat: peran fitur dalam sistem.

## Isi folder
- `<x>.controller.ts` — ...
- `<x>.service.ts` — ...
- `<x>.routes.ts` — ...
- `<sub-fitur>/` — ... (kalau ada)

## Keterkaitan
Pola "ubah X di sini → efek ke fitur [Y] (flow/DB)".
Contoh: "ubah field `assignedTo` di Canal → efek ke [penugasan] (query mine) + [sync] (admin-field server-wins)."

## Jobs/Cron
Ref `server/src/jobs/INDEX.md`. Kalau tidak punya job, tulis "—".

## Aturan domain
Ref `DOMAIN.md` poin N yang relevan. Jangan duplikat isinya, cukup pointer + 1 baris ringkas.
```
