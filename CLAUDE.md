# CLAUDE.md — new-hydro-canal

> Instruksi untuk Claude saat sesi baru di repo ini. Baca sebelum mulai apa-apa.

## Konteks 30 detik

**new-hydro-canal** = app ops + QC kanal untuk PT. Karta Bhumi Nusantara (vendor pelaksana QC). Menggantikan app lama [`fullstack-hydrocanal-graph`](https://github.com/luhtaf/fullstack-hydrocanal-graph) sebagai **superset** (semua fitur lama wajib di-port + ditambah ops layer baru).

Stack produksi: **React + Vite + TS + PouchDB + Chart.js + Leaflet**. Sister app: [`../finago/`](../finago/) (FINA go expense).

Status: **Phase 0 (demo mockup) selesai, ~3000 baris vanilla HTML+JS+CSS.** Implementasi produksi belum mulai.

## Sebelum kerja apa-apa, baca urutan ini

1. [`README.md`](./README.md) — overview + docs index table
2. [`DOMAIN.md`](./DOMAIN.md) — data model AOI + aturan turunan (sumber kebenaran)
3. [`FEEDBACK.md`](./FEEDBACK.md) — semua feedback historis + mapping ke phase
4. [`PLAN.md`](./PLAN.md) — master roadmap + tech stack + 8 phase
5. [`PLAN-FE.md`](./PLAN-FE.md) — frontend detail per page + demo subset wajib dipertahankan
6. [`PLAN-BE.md`](./PLAN-BE.md) — backend schema + endpoint + sync algorithm
7. [`demo/README.md`](./demo/README.md) — demo features + cara coba

## Demo HTML = reference design

Demo di [`demo/`](./demo/) adalah ground truth untuk UI/UX produksi. Saat implementasi React:

- **Port struktur + interaksi** dari demo, jangan reinvent
- Semua "touches" di demo (dark mode, ⌘K palette, walkthrough tour 8-step, role pill, real export, lock badges, dll) **WAJIB dipertahankan** — check-list 14 kategori di `PLAN-FE.md` section "Demo subset"
- Visual: Tailwind + Lucide + Inter font + brand sky/cyan

## Filosofi: NEW = SUPERSET dari EXISTING

App ini bukan tambahan di samping app lama — tapi **menggantikan sepenuhnya**:

- Semua route Express lama (`/datas`, `/data/:id` polymorphic, `/exportallchart/:id`, dll) → wajib di-port (Phase 1)
- Semua page React lama (MainData → Data → DetailData nested, Chart drag, Excel bulk import, dll) → wajib di-port (Phase 1 + 5)
- Plus ops layer baru (AOI undangan, penugasan grouped, offline PouchDB, role, reports, audit)
- Plus 5 fitur "belum terealisasi" di app lama (Excel page 2 export, nested DB optimization, login session, district by region, detail keterangan di chart)

Detail di `PLAN.md` section "Filosofi" + "Existing system inventory".

## Domain critical points

Wajib hafal sebelum touch code:

1. **AOI = per-canal Order No** (BUKAN per undangan). 1 baris Excel = 1 Canal ID dengan Order No sendiri (mis. `2000349189`).
2. **Deadline = Request Date + 4 hari** (hari masuk = hari ke-1, maks 5 hari).
3. **Penugasan multi-distrik/kontraktor** → grouping **Kontraktor → Distrik → Canal cards** + summary chip.
4. **Measure Date clamp**: jika > Finish Date AOI, otomatis di-set ke Finish Date.
5. **Final depth formula**: `(depth + WL + tranducer + bed_float - depth_correction) * -1`. Sinkron di FE drag chart + BE chartjs-node-canvas.
6. **Output filename**: `[district-code]-[YYMMDD]-[USV]-[urut][rev][qctype]` (mis. `3C01-260518-KBN01-1R0Q1`).

## Filosofi (preferensi Fathul)

- Bahasa Indonesia casual untuk komunikasi
- Rekomendasi konkret + tradeoff singkat, bukan jawaban hedge
- "Lanjut all" pattern saat opsi banyak — interpret as: build semua opsi yang ditawarkan
- Demo dulu sebelum production
- Polish production-ready, bukan setengah jadi
- AI-context-aware: docs di-split per concern, polyrepo

## Jangan dilakukan

- ❌ Jangan replace schema lama (`Datas`, `Pengukurans`, `Districts`) — extend saja
- ❌ Jangan ganti formula final depth — sinkron 2 tempat
- ❌ Jangan hilangkan demo "touches" saat port ke React
- ❌ Jangan pakai full CouchDB sync (revision tree bengkak karena nested schema) — pakai custom REST sync
- ❌ Jangan campur konteks dengan `../finago/` — pindah sesi kalau user nanya tentang FINA go
- ❌ Jangan `git add -A` di root project (banyak file pribadi nyasar) — eksplisit per file

## Existing app reference

App lama: [`luhtaf/fullstack-hydrocanal-graph`](https://github.com/luhtaf/fullstack-hydrocanal-graph) (branch `fathul`).

Yang **wajib dibaca** dari sana sebelum Phase 1:

- `CLAUDE.md` — convention existing (polymorphic `:id`, final depth formula, color thresholds, splash suppression, dll)
- `controllers/ChartController.js` — chartjs-node-canvas + headerPlugin + thresholdLinePlugin
- `controllers/DataController.js` — CRUD pattern + reverse drag formula
- `routes/DataRoute.js` — pattern endpoint
- `Perencanaan Update Software QC Kanal.pptx` — requirement asli dari PM

## Resume sesi

1. Cek file mana yang user mau garap (`PLAN.md` Phase 1-8)
2. Kalau planning → tambah ke docs yang ada
3. Kalau implementasi → mulai dari Phase 1 (Foundation), jangan loncat
4. Selalu ref ke demo HTML saat butuh visual/interaksi
