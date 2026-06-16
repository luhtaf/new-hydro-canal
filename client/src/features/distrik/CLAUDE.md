---
feature: distrik
owns: []                                  # FE slice — tak punya model; konsumsi [district] BE
uses_models: []
touches_features: ["district", "undangan", "penugasan", "qc"]
jobs: []
---

# Fitur: Distrik (FE — master distrik & region, admin only)

## Apa ini
Halaman admin kelola master distrik & region (`/distrik`): distrik dikelompokkan
per Region (card per region), tiap baris = kode 4-char (mono badge brand) + nama
distrik + aksi (edit / hapus). Tombol "Tambah distrik" → DistrikForm modal. Banner
info konflik kode antar-region. Port demo `view-distrik`. Pasangan BE: slice
[district] server (`/districts/*`). Jalur admin online (TanStack Query langsung ke
API, bukan PouchDB).

## Isi folder
- `DistrikList.tsx` — **default export**, page `/`. Header + grid card-per-region + state empty/error/skeleton + banner info, orkestrasi modal.
- `DistrikForm.tsx` — modal tambah/edit (react-hook-form + zod). Field name/kode/regionName/contractorId.
- `api.ts` — wrapper transport `/districts/*` (reuse `apiClient` [auth]); respons `{ data }` di-unwrap. Mapping field server `districtName`/`districtId` ⇄ label UI `name`/`kode`. Tipe `Distrik`.
- `hooks.ts` — TanStack Query (list + create/update/delete) + `groupByRegion`. Query key `['districts','list']`.
- `routes.tsx` — `distrikRoutes` lazy (`/distrik`, requireRole admin).
- `index.ts` — barrel publik (routes + page + hooks + tipe distrik).
- `components/DistrikRow.tsx` — 1 baris distrik dalam card + menu aksi (dropdown klik-luar).

## Keterkaitan
- Konsumsi endpoint slice [district] BE (`/districts`). Server pakai field `districtName`/`districtId`, update lewat **PUT** (bukan PATCH), DELETE polymorphic (`/:id?`). Ubah shape respons di BE → update mapping `fromWire`/`toWire` di `api.ts`.
- Reuse `apiClient` [auth] → interceptor 401→app-lock konsisten.
- Ubah `kode` (districtId 4-char) → efek ke [qc] (output filename `[district-code]-...`, DOMAIN.md poin 7).
- `regionName` dipakai untuk grouping di sini + [reports] (group per-region) + header chart [qc].
- Distrik dipakai saat assign [undangan]/[penugasan] — kode sama bisa beda region (banner peringatan).
- Tone badge/aksi pakai kelas Tailwind STATIK (JIT tak baca string dinamis) — JANGAN ganti ke `bg-${x}-50`.

## Jobs/Cron
—

## Aturan domain
- DOMAIN.md poin 7 — output filename pakai `districtId` (kode 4-char). Form meng-uppercase + batasi alfanumerik ≤8.
- PLAN-BE.md "District (extended)" — body server dukung `regionName` + `contractorId` (extend, bukan replace).
- Spec § A — admin online path → TanStack Query, bukan PouchDB.
