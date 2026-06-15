# Foundation Architecture — Design Spec

> Status: **Approved** (2026-06-15). Keputusan fondasi yang mengikat untuk implementasi produksi new-hydro-canal. Hasil brainstorming sesi 2026-06-13 s/d 2026-06-15. Acuan turunan: `PLAN.md`, `PLAN-BE.md`, `PLAN-FE.md`, `DOMAIN.md`.

Spec ini mematangkan 4 keputusan fondasi yang saling terkait (arsitektur kode, infra, auth, sync) **sebelum** menulis kode, supaya implementasi tidak bongkar-pasang. Ini ADR-style foundation spec, bukan rencana implementasi per-fitur (itu di writing-plans).

---

## § A. Arsitektur kode — Vertical Slice + Shared + Per-feature docs

**Pola: package-by-feature (vertical slice)**, bukan package-by-layer. Tiap fitur punya controller + model(owned) + service + sub-folder sub-fitur dalam satu folder. Berlaku di BE dan FE.

```
server/src/
├── shared/                 # cross-cutting — BUKAN fitur
│   ├── models/             # model shared: Data, Canal, Aoi, Pengukuran, District, User, Contractor, AuditLog, Notification
│   ├── domain/             # finalDepth, deadline, threshold, shortName, splitCanal, fileName, utm
│   ├── middleware/         # auth, audit, error
│   └── db/                 # mongoose connect
├── features/
│   ├── <fitur>/
│   │   ├── CLAUDE.md       # WAJIB
│   │   ├── *.controller.ts ├── *.routes.ts ├── *.service.ts
│   │   └── <sub-fitur>/    # folder sendiri (+ CLAUDE.md kalau non-trivial)
└── jobs/
    └── INDEX.md            # registry SEMUA cron: jadwal · fitur tersentuh · owner

client/src/                 # mirror: shared/ + features/<fitur>/ (+ CLAUDE.md)
```

### Guardrail GLOBAL (wajib semua agent — tulis di root CLAUDE.md)

Berlaku di SELURUH repo. Per-feature CLAUDE.md boleh **menambah** guardrail lokal, **tidak boleh override/ignore** yang global (prinsip global > local).

1. **`shared/` bukan junk-drawer.** Sesuatu masuk `shared/` HANYA jika dipakai ≥2 fitur DAN tidak punya owner jelas. Kalau ada owner → taruh di fitur owner, fitur lain import.
2. **Doc tidak boleh basi.** Kode = source of truth; CLAUDE.md = pointer. Cross-link via frontmatter greppable, bukan prosa bebas. Ubah kode yang ngubah keterkaitan → update frontmatter di PR yang sama.
3. **Earn the folder, earn the CLAUDE.md.** Jangan bikin subfolder/CLAUDE.md seremonial. CLAUDE.md kosong/boilerplate = noise > signal = dilarang.

### Template per-feature CLAUDE.md

```markdown
---
feature: <slug>
owns: []                      # model/collection yang fitur ini punya
uses_models: []               # model shared yang dipakai
touches_features: []          # fitur lain yang kena kalau ini diubah
jobs: []                      # cron yang dimiliki fitur ini (ref jobs/INDEX.md)
---
# Fitur: <Nama>

## Apa ini            — 1-2 kalimat
## Isi folder         — controller/service/sub-fitur, 1 baris masing-masing
## Keterkaitan        — "ubah X di sini → efek ke fitur [Y] (flow/DB)"
## Jobs/Cron          — ref jobs/INDEX.md
## Aturan domain      — ref DOMAIN.md poin N
```

---

## § B. Infra — Hybrid

- **FE static** → Cloudflare/Vercel **Pages** (gratis).
- **API + sync endpoint + `chartjs-node-canvas` + (SSO later)** → **1 box always-on** (Fly.io/Render/Railway, ~$5/bln). Native canvas + SSE + session butuh runtime stateful.
- **MongoDB** → Atlas managed atau di box yang sama.
- Alasan menolak serverless murni: `chartjs-node-canvas` butuh native lib (cairo/pango) yang tidak jalan di CF Workers/Vercel functions; self-hosted SSO stateful.

---

## § C. Auth — Multi-akun, simpel (no token akrobat)

- **Login wajib online** untuk enroll/add account → tarik data via `/sync/seed`. (Login pertama TIDAK bisa offline — hukum auth; device harus pernah connect.)
- **Multi-akun per device** (add/switch ala Gmail). Switch **offline OK** kalau akun itu sudah pernah login online di device tsb.
- Online = **session cookie** biasa (ada box always-on). Offline = state "logged-in" tersimpan lokal. Stay logged-in sampai **logout eksplisit** — tanpa refresh/trust-window math.
- **App-lock PIN/biometrik ON by default** (gembok buka-app lokal, bukan token) — bisa dimatikan. Admin bisa **revoke akun** (efektif saat device online lagi).
- Tiap akun = **PouchDB namespace sendiri** (`hydrocanal-<userId>`) + **indikator sync per-akun** ("✅ full sync" / "⏳ N belum terkirim").
- **Grain identitas: akun = orang.** USV ikut dari data assignment (stempel ke klien). Identity utama = `email`; sisakan field `idpSubject` (kosong) untuk bolt-on SSO di masa depan.
- **SSO repo lain: YAGNI sekarang.** App ini auth sendiri. Saat repo ke-2 butuh, box always-on dipasangi IdP (Authentik/Zitadel), app bolt-on "login via SSO" sebagai metode enrollment.
- **Security tradeoff (diakui):** login nempel di device lapangan → device hilang = akun terbuka sampai logout/revoke. Mitigasi = app-lock + revoke server-side.

---

## § D. Sync — Local-first, custom REST → Mongo

### Prinsip inti: SATU jalur tulis
UI **hanya** baca/tulis ke **PouchDB** — bahkan saat online. **Sync engine terpisah** memindahkan PouchDB ⇄ server di belakang layar. Online/offline **invisible** untuk logika app. (Menghindari dual-write = sumber korupsi data #1.)

### Granularity: doc kecil flat + projection
Offline menulis **doc kecil flat** (`parameter:<canalId>`, `depth:<canalId>:<sta>`), **server memproyeksikan** menjadi schema `Data` nested (`canal_data[] > data[]`). Decouple model-sync dari model-baca legacy → menghindari revision-tree bloat & bikin sync engine sederhana.

### Transport: custom REST ke Mongo (bukan CouchDB)
- Outbound: PouchDB changes → debounce (5 dtk / 50 doc) → `POST /sync/push`.
- Inbound: `GET /sync/pull?since=<seq>` (polling 30 dtk / saat tab fokus).
- Per-doc timestamp-based conflict detection.
- **Idempotent**: kirim doc yang sama 2x = efek sekali.

### Error handling
- **Outbox pattern**: tiap perubahan = op durable di PouchDB; **retry + backoff**; gagal = tetap mengantri (tidak pernah hilang) → sumber indikator "⏳".
- **Konflik** (doc sama diedit 2 tempat) → UI `/konflik`. Strategi default: LWW untuk parameter, **manual** untuk kedalaman, server-wins untuk admin-field (status/assignedTo/threshold).
- **Pouch lokal korup** → re-seed dari server (server = source-of-truth assignment+master; push agresif memperkecil window data belum-sync).

---

## § E. Testing fondasi

- **Unit**: domain helpers (deadline, depth, threshold, fileName, splitCanal, utm), projection flat→nested, conflict detection.
- **Integration** (mongo-memory-server): sync push/pull, outbox retry, idempotency, audit middleware, aoiParser.
- **E2E** (Playwright): enroll→offline→edit→online→sync; add-account→switch; trigger konflik→resolve.

---

## Keputusan yang TIDAK berubah (dari spec/CLAUDE.md sebelumnya)

- Schema lama (`Datas`, `Pengukurans`, `Districts`) di-extend, bukan di-replace.
- Final depth formula sinkron FE (Chart.js drag) & BE (chartjs-node-canvas).
- Polymorphic `:id` endpoint existing dipertahankan.
- Semua "demo touches" (dark mode, ⌘K, tour 8-step, role pill, real export, dll) dipertahankan saat port — checklist di `PLAN-FE.md`.
- Visual produksi: premium / tidak terlihat AI-generated (design pass + DESIGN.md saat build FE).

## Urutan implementasi

1. **Phase 1 Foundation (sekuensial dulu, lalu fan-out):** monorepo skeleton → shared contracts → auth core + sync engine core → port existing CRUD → guardrails/docs. Fitur ops (Phase 2+) menyusul.
2. Fan-out paralel **hanya setelah** skeleton + kontrak shared ada (arsitektur vertical-slice dirancang untuk ini).
