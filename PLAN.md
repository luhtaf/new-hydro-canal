# Implementation plan — master

> **Status sekarang**: Phase 0 (demo mockup) selesai. Ini master plan untuk implementasi produksi yang menjadikan app baru sebagai **pengganti penuh** [fullstack-hydrocanal-graph](https://github.com/luhtaf/fullstack-hydrocanal-graph) — bukan tambahan. Semua fitur existing **WAJIB terakomodir** + ditambah ops layer baru (undangan, penugasan, offline, role).

## Urutan bacaan (resume sesi Claude baru)

1. [`README.md`](./README.md) — overview + arsitektur target + modul list
2. [`DOMAIN.md`](./DOMAIN.md) — data model AOI + aturan turunan (sumber kebenaran domain)
3. [`FEEDBACK.md`](./FEEDBACK.md) — semua feedback historis (PPTX + existing terealisasi + WM) + mapping ke phase
4. **`PLAN.md`** (file ini) — master roadmap + tech stack + phase list
5. [`PLAN-FE.md`](./PLAN-FE.md) — frontend implementation detail per page/komponen/state
6. [`PLAN-BE.md`](./PLAN-BE.md) — backend implementation detail: schema, endpoint, sync, port logic existing
7. [`demo/README.md`](./demo/README.md) — demo features + cara coba
8. [`demo/index.html`](./demo/index.html), [`demo/app.js`](./demo/app.js), [`demo/style.css`](./demo/style.css) — ground truth UI/UX

Demo HTML = **reference design**. Implementasi React tinggal port + connect ke backend nyata.

## Filosofi: NEW = SUPERSET dari EXISTING

App baru bukan tambahan di samping app lama — tapi **menggantikan sepenuhnya**:

```
┌─────────────────────────────────────────────────────────────┐
│  APP BARU (new-hydro-canal)                                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EXISTING (fullstack-hydrocanal-graph) — ported     │   │
│  │  • MainData/Data/DetailData CRUD                     │   │
│  │  • Chart.js drag + manual save                       │   │
│  │  • chartjs-node-canvas PNG export                    │   │
│  │  • Bulk download (PNG, Excel page 3)                 │   │
│  │  • Threshold management (Pengukuran)                 │   │
│  │  • District seeding + management                     │   │
│  │  • Splash, breadcrumb, lazy routes                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  + NEW OPS LAYER:                                           │
│  • AOI / Undangan (per-canal Order No)                      │
│  • Penugasan grouped Kontraktor→Distrik                     │
│  • Kalender agenda                                          │
│  • Offline-first PouchDB + custom REST sync                 │
│  • Konflik resolution UI                                    │
│  • Role hierarchy admin/operator                            │
│  • Audit log + Reports                                      │
│  • User management                                          │
│  • Notifications inbox                                      │
│  • Peta UTM (Leaflet + proj4js)                             │
│  • Excel page 2 export, screenshot JPEG                     │
│  • Login session                                            │
│  • District by Region                                       │
│  • Detail di chart header (region/distrik/operator)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Konsekuensinya**:
- Backend: extend schema existing, JANGAN replace. `Datas`, `Pengukurans`, `Districts` collections tetap. Tambah `canals`, `aois`, `users`, `audit_logs`, `notifications`, `contractors`.
- Frontend: rebuild dari nol pakai Vite + React + TS, tapi semua **fitur lama wajib jalan** (port logic dari `client/src/components/` lama).
- Migrasi data: skrip one-shot untuk pindah data lama ke schema baru (kalau perlu).

## Stack target

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend | Vite + React 18 + TypeScript | Modern, fast HMR; TS untuk domain non-trivial |
| Styling | Tailwind CSS + Lucide icons | Sama dengan demo, transisi mulus |
| State (server) | TanStack Query | Cache + sync + retry |
| State (client) | Zustand atau React Context | Simple, no Redux overhead |
| Chart | Chart.js 4 + dragdata + annotation | Reuse dari app lama |
| Map | Leaflet + CARTO Voyager + proj4js | UTM 48S → WGS84 |
| Local DB | PouchDB (IndexedDB) + pouchdb-find | Offline-first, sync custom REST |
| Sync | Custom REST (bukan CouchDB `_replicate`) | Schema nested deeply, Couch revision tree bengkak |
| Backend | Express + Mongoose + express-session + connect-mongo | Extend existing |
| File parsing | SheetJS (server-side) | Excel import + export |
| Image gen | chartjs-node-canvas | Port dari app lama |
| Auth | Session cookie + PIN hash (bcrypt) | Sederhana, closed user group |
| Deploy | Docker Compose dev → VPS / Fly.io | TBD; existing pakai docker-compose |

**Tidak dipakai**: Next.js (overkill), GraphQL (REST cukup), NoSQL lain.

## Phase overview

| Phase | Goal | Estimasi | Existing yang di-port |
|---|---|---|---|
| **0** | Demo mockup (UI/UX reference) | ✅ DONE | — |
| **1** | Foundation: monorepo, schema, auth, basic CRUD lama | 2 minggu | MainData, Data, DetailData CRUD; District seeding; Pengukuran singleton |
| **2** | AOI ingestion: Excel import, list, detail, deadline | 1 minggu | — (fitur baru) |
| **3** | Penugasan + role hierarchy + nav gating | 1 minggu | — (fitur baru) |
| **4** | Offline-first PouchDB + custom REST sync + konflik | 2 minggu | — (fitur baru) |
| **5** | Field input: parameter form (clamp), kedalaman, drag chart | 1.5 minggu | Chart.js drag, manual save, Excel import page 3, validation indicators |
| **6** | QC processing: PNG/TXT/Excel/PAT/ZPM32 export, integrasi | 1.5 minggu | chartjs-node-canvas, exportAllChart, headerPlugin, thresholdLinePlugin, bulk download |
| **7** | Admin: reports, audit, users, notifications, district mgmt | 1 minggu | District CRUD, Pengukuran edit |
| **8** | Production: deploy, backup, monitoring, docs | 1 minggu | — |

**Total estimasi: ~11 minggu (~2.5 bulan) untuk 1 dev full-time.**

---

## Phase 0 — Demo mockup ✅ DONE

Lihat [`demo/README.md`](./demo/README.md) untuk daftar lengkap fitur & cara verifikasi.

## Phase 1 — Foundation (2 minggu)

**Goal**: Project skeleton + auth + DB schema baru siap + existing CRUD jalan.

### 1.1 Repo setup

- [ ] Init monorepo: `client/` (Vite + React + TS + Tailwind) + `server/` (Express + Mongoose)
- [ ] `docker-compose.yml`: react (3000) + node (5001) + mongo (27017) + redis (existing)
- [ ] Copy `Dockerfile` + named volumes pattern dari app lama (untuk handle native canvas binary)
- [ ] `.env.example`, ESLint + Prettier + Husky, GitHub Actions CI

### 1.2 MongoDB schema (extend existing)

**Pertahankan koleksi lama** (jangan rename/drop):
- `Datas` — schema nested (lihat `DOMAIN.md`)
- `Pengukurans` — singleton threshold
- `Districts` — auto-seeded

**Tambah koleksi baru** (detail field di `PLAN-BE.md`):
- `users` — auth + role
- `aois` — header batch import dari Excel WM
- `canals` — 1 doc per row AOI (lihat `DOMAIN.md` Aturan AOI)
- `audit_logs` — riwayat aksi
- `notifications` — inbox per user
- `contractors` — full name + short name (untuk chart export)

### 1.3 Port endpoint existing ke server baru

Semua route dari [`fullstack-hydrocanal-graph/routes/`](https://github.com/luhtaf/fullstack-hydrocanal-graph) harus ada di server baru. Detail di `PLAN-BE.md` section "Port existing routes". Singkat:

- `/datas/:id` (Data document)
- `/data/:id` (canal_data segment, polymorphic :id)
- `/detaildata/:id` (depth point)
- `/dataschart/:id`, `/datachart/:id`, `/updatechartdata/:id`
- `/exportallchart/:id`, `/cleartmp`
- `/pengukuran` (threshold)
- `/districts`
- `/version`

### 1.4 Auth (fitur baru — yang belum di-app lama)

- [ ] `POST /auth/login` `{ usv, pin }` → session cookie
- [ ] `GET /auth/me`, `POST /auth/logout`
- [ ] Middleware `requireAuth`, `requireRole('admin')`
- [ ] Client: AuthContext + ProtectedRoute + login page

### 1.5 Routing client

- [ ] React Router v6 dengan lazy loading (pertahankan pattern dari app lama)
- [ ] Splash screen (port `SplashScreen.js`), suppress di URL `viewdata` (port `SPLASH_BLOCK_PATHS`)
- [ ] Global breadcrumb (port `AppBreadcrumb.js`)
- [ ] Route guard berbasis role

### 1.6 Port frontend existing ke React baru

Detail page-by-page di `PLAN-FE.md` section "Port existing components". Singkat:

| Existing component | Route lama | Status di app baru |
|---|---|---|
| `MainDataList` | `/` | Port → integrate dengan AOI/Penugasan flow |
| `AddMainData`, `EditMainData` | `/addMainData`, `/editMainData/:id` | Port → admin-only |
| `DataList` | `/viewData/:id` | Port (sumber Excel page 3 bulk + checkbox shift-select) |
| `AddData`, `EditData` | `/viewData/:id/{add\|edit}Data/:id` | Port |
| `ChartData` | `/viewData/:id/chartData/:id` | Port (drag chart + threshold lines) |
| `ChartPreview` | `/viewData/:id/chartPreview/:id` | Port (preview sebelum bulk export) |
| `DetailDataList` | `/viewData/:id/viewDetailData/:id` | Port |
| `AddDetailData`, `EditDetailData`, `ChartDetailData` | nested | Port |
| `EditPengukuran` | `/pengaturan` | Port + admin-lock |
| `EditDistrictList` | `/districts` | Port + tambah region field |

### Definisi selesai Phase 1

- [ ] User bisa login dengan PIN
- [ ] Semua route CRUD lama jalan di server baru
- [ ] Semua page CRUD lama jalan di client baru (mode read sebagai admin)
- [ ] Threshold + District seeding berfungsi
- [ ] CI hijau

---

## Phase 2 — AOI ingestion (1 minggu)

**Goal**: Excel AOI dari WM bisa di-import, tampil di list, deadline countdown jalan. Detail di `PLAN-BE.md` (parser, endpoint) + `PLAN-FE.md` (list & detail page).

- [ ] `POST /aoi/import` (multipart xlsx) — parse SheetJS server-side
- [ ] Validasi header AOI (Region/Area/Vendor) + per-baris (Order No unik, Coord numeric, etc.)
- [ ] Simpan AOI batch doc + bulk insert `canals`
- [ ] `GET /aois`, `GET /canals?status=&district=&contractor=&q=`, `GET /canals/:orderNo`
- [ ] Port UI demo: `view-undangan`, `view-undangan-detail`, `view-undangan-baru` (wizard 4-step + auto-split kanal > 999m)
- [ ] Audit log: "AOI imported"
- [ ] Notification ke semua admin saat AOI baru masuk
- [ ] Live deadline countdown (port `deadlineInfo()` ke shared util)

---

## Phase 3 — Penugasan + role gating (1 minggu)

**Goal**: Admin assign canal ke operator, operator lihat penugasannya grouped. Role hierarchy aktif.

- [ ] `POST /canals/assign` (bulk) → status `Submitted` → `Assigned`
- [ ] `GET /penugasan/mine` — query canals `assignedTo: me`
- [ ] Port `renderPenugasan` (grouping Kontraktor → Distrik dengan summary chip)
- [ ] Tab Aktif / Selesai
- [ ] Role gating: React Router guard + backend middleware enforce
- [ ] Lock badge UI di field admin-only (Pengaturan threshold)
- [ ] Notifikasi push ke operator

---

## Phase 4 — Offline-first PouchDB + sync (2 minggu)

**Goal**: Operator bisa kerja tanpa sinyal, sync saat online, konflik bisa di-resolve.

- [ ] `pouchdb-browser` + `pouchdb-find` setup. DB lokal per user: `hydrocanal-<userId>`
- [ ] Initial seed saat login: pull penugasan saya, master district, threshold, contractor mapping
- [ ] **Sync strategy** (lihat `PLAN-BE.md` section "Sync"):
  - Outbound: PouchDB changes feed → batch `POST /sync/push`
  - Inbound: periodic `GET /sync/pull?since=<lastSeq>`
  - Per-doc timestamp-based conflict detection
- [ ] Queue UI (port dari demo)
- [ ] Connectivity (real `navigator.onLine` + periodic ping fallback)
- [ ] Konflik resolution UI (port `view-konflik` — single-field radio + multi-field table)
- [ ] Strategy per field (last-write-wins untuk parameter, manual untuk kedalaman point)

---

## Phase 5 — Field input (1.5 minggu)

**Goal**: Operator isi parameter + ukur kedalaman, semua offline-capable. Existing chart drag jalan.

### 5.1 Parameter form

- [ ] Port `view-lapangan-parameter`: Canal info + parameter pengukuran
- [ ] Auto-fill dari assignment (Canal ID, Order No, District, Contractor, Measure Point, Coord X/Y, Dimensi)
- [ ] **QC Date (Budat) + Measure Date dengan clamp logic** (lihat `DOMAIN.md`):
  - On change measureDate: if > finishDate → set ke finishDate + warning toast
- [ ] Validasi inline real-time:
  - Order No pattern (per AOI: 10 digit numeric)
  - Operation No default 0010 → warning
  - Measure Point tanpa spasi
  - Max 3 angka belakang titik
  - Panjang kanal = Σ STA
  - ID Kanal match page 3
- [ ] Save → PouchDB doc `parameter:<canalId>` (auto-sync)
- [ ] Preview filename live: `[district-code]-[YYMMDD]-[USV]-1R0Q1.txt`

### 5.2 Kedalaman input (existing — di-port)

- [ ] Port `ChartData.js` + `ChartDetailData.js` logic
- [ ] Tabel STA editable + input depth per row
- [ ] Chart.js draggable bar (reuse `chartjs-plugin-dragdata`)
  - Drag end → update PouchDB doc + queue sync
  - Re-color sesuai threshold real-time
  - Threshold annotation lines
- [ ] **Multiple Excel import page 3** (existing — di-port + diperbaiki)
- [ ] GPS capture per row (existing pattern + tambah `navigator.geolocation`)
- [ ] CSV drag-drop import

### 5.3 Peta (fitur baru)

- [ ] Port `view-peta` (Leaflet)
- [ ] UTM → WGS84 via `proj4js` (EPSG:32748)
- [ ] Marker per canal + popup info + link detail
- [ ] Sample STA markers warna threshold

---

## Phase 6 — QC processing & export (1.5 minggu)

**Goal**: Output file QC bisa di-generate. Semua existing export jalan + Excel page 2 + ZPM32 (yang belum di app lama).

### 6.1 Port chart export existing

- [ ] Port `controllers/ChartController.js` (chartjs-node-canvas) → server baru
  - headerPlugin (legend + meta rows)
  - thresholdLinePlugin (pass/fail lines)
- [ ] **Extend headerPlugin**: tambah Region + Distrik + Operator + Status QC di header (fitur belum di app lama)
- [ ] Endpoint: `POST /qc/export/:canalId` → PNG
- [ ] Endpoint: `POST /qc/export-bulk` → ZIP semua PNG
- [ ] Filename naming convention (lihat `DOMAIN.md` aturan 7)

### 6.2 Export tambahan

- [ ] **Excel page 2 (parameter)** — fitur baru via SheetJS server-side
- [ ] **Screenshot JPEG page 2** — fitur baru via headless browser (puppeteer) atau Canvas render
- [ ] Excel page 3 (port existing — sudah ada di app lama)
- [ ] **Request PAT CSV** dengan koordinat UTM (per AOI)
- [ ] **ZPM32 Excel** (mirip TXT format, slide 11 pptx — belum di app lama)
- [ ] TXT format akhir QC (header + content sesuai pptx slide 4)

### 6.3 Status flow

- [ ] Saat export berhasil → set canal `status = Done`, `qcOutput = <filename>`
- [ ] Update penugasan + dashboard UI

---

## Phase 7 — Admin extras (1 minggu)

**Goal**: Admin visibilitas penuh + manajemen.

- [ ] `/reports` — port dari demo: KPI cards, trend line, bar per region, donut, productivity table
- [ ] `/audit` — port dari demo: timeline filter user/action/date
- [ ] `/users` — CRUD operator, assign USV, role change, status (aktif/cuti)
- [ ] `/distrik` (existing) — port + **tambah field Region** per distrik (fitur baru pptx slide 9)
- [ ] `/pengaturan` (existing) — port + admin-lock + slider live threshold (port dari demo)
- [ ] `/notifikasi` — inbox + SSE atau polling 30s untuk realtime
- [ ] `/kalender` — port dari demo, integrate dengan AOI + Penugasan + Deadline

---

## Phase 8 — Production deploy (1 minggu)

- [ ] Multi-stage Dockerfile (client static + server)
- [ ] `docker-compose.prod.yml`
- [ ] MongoDB backup cron (daily dump → S3 / external storage)
- [ ] HTTPS + reverse proxy (Caddy / Nginx)
- [ ] Monitoring: Sentry (FE + BE), structured logs
- [ ] User onboarding docs (admin guide, operator guide)
- [ ] Smoke test script + canary monitoring
- [ ] Migration script untuk data dari app lama → app baru (opsional, kalau perlu)

---

## Open questions (perlu dijawab sebelum Phase 1)

1. **Multi-vendor?** Sekarang asumsi single vendor PT. KARTA BHUMI NUSANTARA. Perlu handle banyak vendor? — jika ya, header `aois` jadi multi-tenant.
2. **Mobile**: PWA cukup (installable, offline via service worker) atau React Native dedicated?
3. **Auth**: Standalone PIN/USV vs integrasi SSO klien?
4. **Storage QC output**: Lokal file vs S3/object storage?
5. **Realtime**: SSE vs polling untuk notif (SSE perlu sticky session di LB)?
6. **Hosting**: VPS sendiri vs Fly.io vs on-prem klien?
7. **Migrasi data lama**: perlu skrip migration dari `fullstack-hydrocanal-graph` Mongo ke schema baru? Atau start fresh?
8. **PWA install prompt**: aktif default atau opt-in?

---

## Quick reference: existing system inventory

### Backend (Express + Mongoose)

**Files yang harus di-port** dari `fullstack-hydrocanal-graph`:

```
controllers/
  ├── ChartController.js          → Phase 6 (chartjs-node-canvas + extend header)
  ├── ClearTemp.js                → Phase 6 (tmp/ cleanup)
  ├── DataController.js           → Phase 1 (CRUD)
  ├── DefaultDistrictController.js → Phase 1 (seeding)
  ├── DistrictController.js       → Phase 1 (CRUD) + Phase 7 (region field)
  └── PengukuranController.js     → Phase 1 (CRUD) + Phase 7 (admin lock)

models/
  ├── DataModel.js                → Phase 1 (pertahankan, mungkin extend)
  ├── DistrictModel.js            → Phase 1 + Phase 7 (tambah region)
  └── PengukuranModel.js          → Phase 1 (pertahankan)

routes/
  ├── DataRoute.js                → Phase 1
  ├── DistrictRoute.js            → Phase 1
  └── PengukuranRoute.js          → Phase 1

index.js                           → Phase 1 (cors, mongoose connect, dotenv, tmp static, addAllDefaultDistricts on db.open)
districts.txt                      → Phase 1 (file copy, format `name|code`)
Dockerfile                         → Phase 1 (canvas native deps: cairo, pango, libgif, librsvg)
docker-compose.yml                 → Phase 1 (named volumes pattern untuk node_modules)
```

### Frontend (React)

**Files yang harus di-port** dari `fullstack-hydrocanal-graph/client/src`:

```
App.js                  → Phase 1 (splash + breadcrumb pattern)
router.js               → Phase 1 (lazy routes pattern, ganti react-router v6 sintaks)
components/
  ├── AppBreadcrumb.js          → Phase 1
  ├── pages/SplashScreen.js     → Phase 1
  ├── MainData/                 → Phase 1 (list/add/edit + Pengaturan + Districts)
  ├── Data/                     → Phase 1 + Phase 5 (DataList = page 3 bulk download + checkbox shift-select)
  ├── Chart/                    → Phase 5 (ChartData drag, ChartPreview)
  └── DetailData/               → Phase 1 (CRUD + ChartDetailData)
```

### State management pattern existing → app baru

| Existing pattern | App baru |
|---|---|
| `axios` direct call per component | TanStack Query untuk server state |
| `useState` lokal | Zustand untuk shared (auth, settings) |
| `useParams` polymorphic `:id` | React Router v6 nested + clear param names |
| `localStorage` ad-hoc (tidak ada di app lama) | PouchDB untuk offline cache + localStorage untuk UI prefs |

---

## Konvensi yang dipertahankan dari app lama (penting)

1. **Polymorphic `:id` di backend**: same `:id` value bisa berarti Data document, canal_data segment, atau depth point — tergantung endpoint. Pakai positional `$` operator + `arrayFilters` untuk Mongo query.
2. **Final depth formula** identik di client (Chart.js drag) dan server (chartjs-node-canvas) — wajib sinkron.
3. **tmp/ folder** untuk PNG sementara, served sebagai static, cleared via `DELETE /cleartmp` saat frontend mount.
4. **District seeding** dari `districts.txt` di `mongoose.connection.once('open')` — hanya insert missing, tidak hapus.
5. **Threshold color logic**: `< tidakLulus` → red, `≥ batasAwal && < batasAkhir` → blue (tolerance), `≥ lulus` → green. Implementasi di 2 tempat (client drag-chart + server chartjs-node-canvas).
6. **Splash screen suppression** di URL `viewdata` (deep link tidak flash splash).

Semua ini sudah dijelaskan di [`CLAUDE.md`](https://github.com/luhtaf/fullstack-hydrocanal-graph/blob/fathul/CLAUDE.md) repo lama — wajib dibaca sebelum start Phase 1.

---

## Cara verifikasi feature di demo (untuk demo stakeholder atau test development)

```bash
cd demo && python3 -m http.server 8080
# buka http://localhost:8080
```

Flow demo:
1. Buka → walkthrough tour auto-trigger (8 step)
2. ⌘K → "trigger konflik" → enter → konflik muncul real-time di `/konflik`
3. Toggle role di top right: Admin ↔ Operator → nav menu berubah, threshold lock
4. `/lapangan/kedalaman` → drag bar chart → row table + status badge update
5. `/qc` → klik tombol Excel → file beneran di-download
6. Toggle offline (icon Wi-Fi) → banner kuning → form jalan → online → "Sinkron sekarang"
7. `/peta` → Leaflet map dengan pin per canal
8. `/penugasan` → grouping Kontraktor → Distrik (multi-district demo)
9. `/undangan` → tabel canal dengan Order No berbeda + deadline countdown

---

## Lihat juga

- **`PLAN-FE.md`** — frontend implementation per page/komponen/state/test
- **`PLAN-BE.md`** — backend schema, endpoint per route, sync algorithm, port logic existing
- **`DOMAIN.md`** — domain model AOI + aturan turunan
- **`FEEDBACK.md`** — feedback log per sumber (PPTX, WM, Fathul, existing)
- **`demo/README.md`** — demo features + cara coba
