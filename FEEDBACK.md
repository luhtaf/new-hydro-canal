# Feedback log

> Konsolidasi semua feedback yang membentuk app ini. Dari requirement awal (PPTX) → fitur existing yang sudah terealisasi → fitur existing yang belum + roadmap app baru → feedback WM tentang struktur AOI. Acuan saat implementasi: tiap point harus jelas masuk Phase mana.

## 1. Requirement awal (PPTX `Perencanaan Update Software QC Kanal`)

Sumber: PPTX di repo lama [`fullstack-hydrocanal-graph`](https://github.com/luhtaf/fullstack-hydrocanal-graph). Ditulis oleh PM/internal sebelum WM kasih feedback langsung.

### 1a. Penjelasan parameter (slide 3)

- **QC Type**: ada 2 — `QC` dan `RE-QC`. Mempengaruhi REV di file TXT dan nama file (suffix `Q1`/`Q2`). Jika RE-QC, +1 ke nilai Revision di body TXT.
- **Contractor Name** disingkat di chart export (mis. `PT MUSI NAULI LESTARI` → `PT. MNL`).
- **Start & End STA**: untuk kanal panjang > 999m, dibagi 2 segmen.
  - Misal kanal panjang 1200 → split:
    - ID-1: Start=0, End=500, Canal Length=500
    - ID-2: Start=500, End=1200, Canal Length=700
  - STA sambungan 500 di ID-2 di-skip → langsung 520 (hindari duplikat).

### 1b. Format file TXT output (slide 4)

- Hampir semua data dalam TXT dari parameter
- Pada akhir harus ada 1 ruang kosong
- Final Depth = (depth + tranducer + bed float) − depth correction
- REV di TXT = Revision + (QC Type RE-QC ? 1 : 0)
- Header / Sub Header / Content sections
- Nama file format: `[district-3-digit]-[YYMMDD]-[USV]-[urut][rev][qctype]`
  - mis. `3C05-260518-KBN01-1R0Q1`

### 1c. Software Page 1 (slide 5) — MainData list

- Berisi daftar pekerjaan, sangat lag karena data sudah banyak (perlu optimasi nested DB)
- Tidak perlu login karena cuma lokal (catatan: app baru BERUBAH — pakai login)
- Pengaturan untuk threshold lulus/tidak lulus/toleransi dan daftar distrik

### 1d. Software Page 2 (slide 6) — Parameter

- **Indikator validasi**: panjang kanal parameter == Σ STA page 3, ID kanal & nama harus match, Measure Point tanpa spasi, max 3 angka belakang titik untuk WL/correction/bedfloat, Operation No default `0010` → warning kalau bukan. Indikator merah/jingga/hijau.
- Select semua data untuk export massal
- **Export data kedalaman page 3 DAN parameter page 2** (supaya tidak bolak-balik buka Excel)
- Import page 3 secara massal dengan nama file cocok dengan Canal ID

### 1e. Software Page 3 (slide 7) — Kedalaman

- Show grafik dipindah dari page 2 saja (langkahnya tidak terlalu panjang karena sudah ada import massal di page 2)
- Page 3 untuk show detail saja, tidak ada yang perlu diubah

### 1f. Software Grafik (slide 8)

- Data grafik = Σ (kedalaman, WL, tranducer, bedfloat) − depth correction
- Grafik bisa di-seret naik turun, **hanya data kedalaman page 3 yang berubah**
- Opsi save (untuk simpan perubahan + kalkulasi) dan export grafik + Excel page 3
- Pada ruang kosong di tengah header berikan informasi Region, distrik, kontraktornya

### 1g. District Management (slide 9)

- Untuk ambil ID distrik dari nama distrik
- **Tambah field Region** untuk info tambahan di chart (mis. PT. Ciptamas Bumi Subur)

### 1h. Export tambahan (slide 10-11)

- Data Request PAT pakai **koordinat UTM**
- Data untuk ZPM32 dalam bentuk Excel mirip TXT

## 2. Fitur existing yang SUDAH terealisasi (di repo lama)

Dari catatan Fathul + git log fullstack-hydrocanal-graph:

- ✅ Tabel viewData centang massal
- ✅ Logika penyimpanan drag grafik + pembulatannya
- ✅ Render chart di node canvas backend (`chartjs-node-canvas` di `controllers/ChartController.js`) — ukuran konsisten lintas browser
- ✅ Chart Preview untuk pengecekan semua grafik sebelum export (`Chart/ChartPreview.js`)
- ✅ Bulk download grafik (PNG via `POST /exportallchart/:id`)
- ✅ Bulk download Excel page 3 data kedalaman (`Data/DataList.js`)
- ✅ Drag chart dengan manual save
- ✅ Auto-detect Excel columns
- ✅ Multiple Excel import untuk Page 3
- ✅ Splash screen (suppressed di URL `viewdata`)
- ✅ Global breadcrumb
- ✅ Lazy routes (`router.js`)
- ✅ Responsive table checkboxes
- ✅ District seeding dari `districts.txt`
- ✅ Color thresholds (red/blue/green per Pengukuran singleton)
- ✅ Status indicator refactor
- ✅ Bug fix bar color bulk download
- ✅ Bug fix black color range di preview chart (di andromedarius-fork branch — perlu di-merge)
- ✅ Export checkbox can select range with shift

## 3. Fitur existing yang BELUM terealisasi (di repo lama, masuk roadmap app baru)

Dari catatan Fathul:

- ❌ Download page 2/parameter ke bentuk Excel dan screenshot JPEG (agar tidak bolak-balik edit Excel manual) — **Phase 6**
- ❌ Memperbaiki nested DB (MainDataList kirim full data padahal hanya butuh id + nama batang kanal) — **Phase 1 schema redesign**
- ❌ Login session: pengguna selain admin tidak bisa edit/delete threshold dan region — **Phase 1 auth + Phase 3 role gating**
- ❌ District by region preference (1 distrik bisa duplikat di region lain, perlu region selector) — **Phase 2.3 District/Region UI**
- ❌ Detail keterangan distrik, region, status QC, operator di sajian grafik — **Phase 6 chart export**

## 4. Roadmap app baru (Fathul, 2026-05)

> "Aplikasinya pengen bikin aplikasi baru banget, dan existing apps ini jadi salah 1 fitur doang. Mereka mau ada pendekatannya dari undangan, jadwal kalender agenda, dan offline-first karena sering masuk ke tempat antah barantah no signal wkwkwkw."

Diterjemahkan ke roadmap:

- Alur baru: **Undangan QC → Jadwal → Penugasan → Input lapangan (offline)** → masuk ke modul QC processing existing
- Kalender agenda
- **Offline-first**: PouchDB di client + custom REST sync ke Mongo existing (BUKAN CouchDB karena schema nested deeply, revision tree akan membengkak)

## 5. Feedback WM (klien, 2026-05-18)

> Sumber: pesan WhatsApp dari WM dengan 4 screenshot Excel AOI asli + komentar.

### 5a. Order No per Canal ID

> "Ini setiap ID akan punya Order No sendiri sendiri mas"

- **Critical correction**: Versi awal mock app salah model (1 Order No per undangan). Sekarang: **1 Canal ID = 1 Order No** (mis. `2000349189`).
- 1 AOI Excel = banyak baris, tiap baris punya Order No sendiri.

### 5b. Field tambahan per canal

> "Juga ada measure point, coordinates, masa SPK (start date, finish date), status, request date"

Field yang wajib ada per canal:
- Measure Point (numerik, mis. `382955`, tanpa spasi)
- Coordinate X / Y (UTM 48S)
- Start Date / Finish Date (masa SPK)
- Status (`Submitted` / `Assigned` / `In Progress` / `Done`)
- Request Date

### 5c. Deadline maks 5 hari

> "Acuan deadline max 5 hari, undangan masuk hari ini sudah di hitung hari pertama"

`deadline = requestDate + 4 hari` (hari masuk = hari ke-1). Tampilan: countdown badge.

### 5d. Header AOI

> Header Excel: Region (Palembang), Area (SUMSEL P1), Vendor (PT. KARTA BHUMI NUSANTARA)

Header ini ditampilkan sebagai konteks AOI (3 card di list & detail page).

### 5e. Multi-district / multi-contractor penugasan

> "Misalnya dalam satu waktu ditugaskan buat mengolah lebih dari 1 distrik dan kontraktor bagaimana tampilannya mas"

**Solusi UI**: Grouping hierarki **Kontraktor → Distrik → Canal cards** di page Penugasan saya. Tiap section punya summary chip (jumlah kanal, total meter, deadline terdekat).

### 5f. QC Date (Budat) vs Measure Date + clamp logic

> "Untuk parameter ada Budat/QC Date dan Measure Date untuk tanggal pengolahan sampai upload data dan tanggal pengukuran. Measure Date tidak selalu mengikuti tanggal pengukuran aslinya, jika tanggal pengukuran sudah lewat dari Finish Date di AOI maka Measure Date mengikuti tanggal Finish Date"

Implementasi: 2 input date di parameter form. Pada change `measureDate`, jika > `finishDate` AOI → auto-clamp ke `finishDate` + warning toast.

## 6. Feedback dari Fathul saat iterasi demo (informal, perlu tetap dipertahankan saat implementasi)

- Komunikasi pakai **Bahasa Indonesia casual**
- Suka **rekomendasi konkret + tradeoff singkat**, bukan jawaban hedge
- Pola "lanjut all" = build semua opsi yang ditawarkan
- Visual: **fresh modern Tailwind-like**, bukan Bulma (tidak nyambung Bulma karena app lama Bulma tapi app baru fresh)
- Struktur file demo: **pisah 3 file** (index.html + app.js + style.css) bukan SPA single file
- Backend approach yang disepakati: **PouchDB client + REST sync ke MongoDB existing**, bukan migrasi penuh ke Couch

## Mapping feedback → Phase implementasi

| Feedback | Phase | File detail |
|---|---|---|
| Schema AOI per-canal Order No | Phase 1 (BE schema), Phase 2 (AOI ingestion) | `PLAN-BE.md` |
| Deadline 5 hari | Phase 2 (BE compute + FE badge) | `PLAN-FE.md`, `PLAN-BE.md` |
| Multi-district grouping penugasan | Phase 3 (FE) | `PLAN-FE.md` |
| QC Date + Measure Date clamp | Phase 5 (FE form) | `PLAN-FE.md` |
| Existing chart drag + manual save | Phase 5 (FE), Phase 6 (BE export) | `PLAN-FE.md`, `PLAN-BE.md` |
| Existing chartjs-node-canvas | Phase 6 (BE — direct port) | `PLAN-BE.md` |
| Existing Excel page 3 bulk export | Phase 6 (BE direct port) | `PLAN-BE.md` |
| ❌ Excel page 2 export | Phase 6 (BE baru) | `PLAN-BE.md` |
| ❌ Nested DB optimization | Phase 1 (BE redesign) | `PLAN-BE.md` |
| ❌ Login session + role | Phase 1 (BE auth), Phase 3 (FE gating) | `PLAN-FE.md`, `PLAN-BE.md` |
| ❌ District by region | Phase 2.3 (BE schema), Phase 7 (FE admin) | `PLAN-FE.md`, `PLAN-BE.md` |
| ❌ Detail keterangan di chart export | Phase 6 (BE — extend headerPlugin) | `PLAN-BE.md` |
| Existing splash, breadcrumb, lazy routes | Phase 1 (FE setup) | `PLAN-FE.md` |
| Existing District seeding | Phase 1 (BE) | `PLAN-BE.md` |
| Threshold edit admin-only | Phase 7 (FE) + Phase 1 (BE middleware) | `PLAN-FE.md`, `PLAN-BE.md` |
| Auto-split kanal > 999m | Phase 2 (FE parser), Phase 5 (FE parameter) | `PLAN-FE.md` |
| Output filename convention | Phase 6 (BE) | `PLAN-BE.md` |
| Request PAT UTM export | Phase 6 (BE) | `PLAN-BE.md` |
| ZPM32 Excel export | Phase 6 (BE baru) | `PLAN-BE.md` |
| Singkatan kontraktor di chart | Phase 6 (BE — `contractors` collection) | `PLAN-BE.md` |
