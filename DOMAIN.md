# Domain model

> Sumber kebenaran (source of truth) domain HydroCanal QC Operations. Semua aturan di sini WAJIB dihormati saat implementasi FE & BE. Terakhir update: feedback WM 2026-05-18.

## Aktor & terminologi

| Aktor | Peran |
|---|---|
| **WM (Work Manager)** | Klien — kirim AOI Excel ke vendor. Sumber data masuk. |
| **Vendor** | Pelaksana QC (mis. PT. KARTA BHUMI NUSANTARA). Yang menjalankan app ini. |
| **Admin / Manager Operasional** | Internal vendor. Terima AOI → assign operator → lihat reports & audit. |
| **Operator (USV)** | Internal vendor. Turun lapangan, isi parameter + ukur kedalaman. Sering offline. Punya `usv` code (KBN01–KBN05). |
| **Kontraktor** | Pemilik kanal yang minta QC (mis. PT CIPTA BUANA SAMUDRA). Beda dari Vendor. Singkatannya muncul di chart export. |
| **District** | Area kerja administratif (mis. `D.SUNGAI_BEYUKU`). 1 kontraktor bisa lintas distrik, 1 distrik bisa banyak kontraktor. |
| **Region** | Grouping distrik geografis (mis. Palembang). Header AOI. |

## AOI (Area of Interest)

Format Excel: **`AOI QC Canal USV Notification`**.

### Header AOI (1 file)

| Field | Contoh |
|---|---|
| Region | Palembang |
| Area | SUMSEL P1 |
| Vendor | PT. KARTA BHUMI NUSANTARA |

### Baris AOI (1 row = 1 Canal ID)

> ⚠️ **CRITICAL**: 1 baris = 1 Canal ID, **tiap canal punya Order No SENDIRI** (bukan 1 order untuk seluruh undangan). Versi awal app salah dimodelkan ini → sudah direvisi.

| Field | Tipe | Contoh | Catatan |
|---|---|---|---|
| **District** | string | `D.SUNGAI_BEYUKU` | format `D.<NAMA_DAERAH>` huruf besar + underscore |
| **Order No** | string | `2000349189` | unik per canal, 10 digit |
| **Request Date** | date | `2026-05-17` | acuan deadline (lihat aturan deadline) |
| **Request Type** | enum | `QC` / `RE-QC` | RE-QC = pengukuran ulang, +1 ke REV di output |
| **Canal ID** | string | `SB180202` | identifier kanal, format kontraktor-spesifik |
| **Panjang** | number | `1000` | meter |
| **Dimensi** | string | `8X5X3` | format `PxLxT` (panjang × lebar × tinggi, meter) |
| **Measure Point** | string | `382956` | numerik, **WAJIB tanpa spasi** |
| **Start Date** | date | `2026-05-01` | masa SPK awal |
| **Finish Date** | date | `2026-05-31` | masa SPK akhir — acuan clamp Measure Date |
| **Contractor Name** | string | `PT CIPTA BUANA SAMUDRA` | nama lengkap; singkat di chart |
| **Coordinate X** | number | `540840` | UTM Easting, zona 48S |
| **Coordinate Y** | number | `9674337` | UTM Northing |
| **Status** | enum | `Submitted` | lihat status flow |

### Status flow

```
Submitted  ─────────► AOI baru terima dari WM, belum di-assign
    │
    ▼ (admin assign ke operator + USV)
Assigned   ─────────► Notif ke operator
    │
    ▼ (operator mulai isi parameter / ukur)
In Progress
    │
    ▼ (chart export OK, file QC tersimpan)
Done       ─────────► qcOutput terisi, masuk ke /qc page
```

Status di backend = `String` enum. UI badge color: Submitted=slate, Assigned=amber, In Progress=brand-blue (pulse), Done=emerald.

## Aturan turunan

### 1. Deadline (max 5 hari)

> Aturan WM: "max 5 hari, undangan masuk hari ini sudah di hitung hari pertama"

```js
deadline = requestDate + 4 days
```

Hari Request Date dihitung sebagai hari ke-1. Total window = 5 hari kerja (termasuk hari masuk).

**UI countdown** (badge color):

| Selisih (hari) | Label | Tone |
|---|---|---|
| > 2 | "Sisa N hari" | emerald |
| 1 atau 2 | "Sisa N hari" | amber |
| 0 | "Deadline hari ini" | rose |
| < 0 | "LEWAT N hari" | rose |

Implementasi di demo: `deadlineInfo()` di `demo/app.js`.

### 2. Multi-district / multi-contractor assignment

> Pertanyaan WM: "misalnya dalam satu waktu ditugaskan buat mengolah lebih dari 1 distrik dan kontraktor bagaimana tampilannya"

Satu operator bisa pegang **>1 kanal lintas distrik & kontraktor sekaligus**.

**UI Penugasan saya**:
- Grouping hierarki: **Kontraktor → Distrik → Canal cards**
- Setiap section kontraktor: ringkasan chip (jumlah kanal, total meter, deadline terdekat)
- Sub-grouping per distrik dengan jumlah kanal + total meter

Implementasi di demo: `renderPenugasan()` di `demo/app.js`.

### 3. QC Date (Budat) vs Measure Date

> Aturan WM: "ada Budat/QC Date dan Measure Date — untuk tanggal pengolahan sampai upload data dan tanggal pengukuran. Measure Date tidak selalu mengikuti tanggal pengukuran aslinya, jika tanggal pengukuran sudah lewat dari Finish Date di AOI maka Measure Date mengikuti tanggal Finish Date"

| Field | Arti |
|---|---|
| **QC Date / Budat** | Tanggal mulai pengolahan data s/d upload (proses internal) |
| **Measure Date** | Tanggal pengukuran (kapan operator turun) |

**Clamp rule** (di form parameter):

```
if measureDateActual > finishDate:
    measureDate = finishDate
    show warning "pengukuran lewat SPK, auto-clamp"
else:
    measureDate = measureDateActual
```

Implementasi di demo: `attachParameterDateLogic()` di `demo/app.js`.

### 4. Final depth (existing — tidak berubah)

```
displayed_depth = (raw_depth + water_level + tranducer + bed_float - depth_correction) * -1
```

- `* -1` untuk flip ke bawah di grafik (deeper = lower bar)
- Drag-edit chart: reverse formula → `raw_depth = displayed - (WL + tranducer + bed_float - correction)`
- Berlaku di client (Chart.js drag) DAN server (chartjs-node-canvas export PNG) — wajib sinkron

### 5. Threshold (Pengukurans collection — existing)

| Field | Tampilan |
|---|---|
| `depth >= lulus` | 🟢 PASS (hijau) |
| `batasAwal ≤ depth < batasAkhir` | 🟡 TOLERANCE (kuning) |
| `depth < tidakLulus` | 🔴 NOT PASS (merah) |

- Singleton document di `Pengukurans` collection
- **Hanya admin** yang boleh edit (per pptx Perencanaan Update + role hierarchy)
- Default contoh: lulus 2.500, tidakLulus 2.000, batasAwal 2.000, batasAkhir 2.500

### 6. Kanal panjang > 999m (auto-split)

> Aturan dari pptx Perencanaan Update Software QC Kanal.

AOI bisa berisi panjang sampai > 1.000m (real: SP223200 = 1107m, SPFB1400 = 1009m).

Saat dibuat parameter / penugasan, kanal di-split jadi 2 segmen logical:

```
Kanal ID:KBN01-K02, panjang 1200m → split:
  Segmen 1: STA 0 → 500   (canal_length=500)
  Segmen 2: STA 500 → 1200 (canal_length=700)

STA sambungan 500 di segmen 2 di-SKIP → langsung 520 (hindari duplikat di output TXT).
```

### 7. Output file naming

Format: `[district-code]-[YYMMDD]-[USV]-[urut][rev][qctype].txt`

Contoh: `3C01-260518-KBN01-1R0Q1.txt`

| Bagian | Contoh | Sumber |
|---|---|---|
| `district-code` | `3C01` | Mapping dari `D.SUNGAI_BEYUKU` → kode 4-char (perlu tabel mapping di collection `Districts`) |
| `YYMMDD` | `260518` | QC Date (Budat) di-format `YYMMDD` |
| `USV` | `KBN01` | USV code operator |
| `urut` | `1` | Nomor urut file dalam 1 hari (per operator, per QC Date) |
| `rev` | `R0` | Revision (default R0) |
| `qctype` | `Q1` | Q1 = QC, Q2 = RE-QC |

**Aturan REV di isi TXT** (beda dengan filename):
```
REV_in_txt = revision + (qcType == 'RE-QC' ? 1 : 0)
```
Misal: Revision `001` + RE-QC → REV di TXT = `002`. Tapi nama file pakai `2R0` (rev terpisah dari qcType).

### 8. Contractor short name (untuk chart export)

Singkatan ditampilkan di header chart PNG (bukan nama lengkap):

| Lengkap | Short |
|---|---|
| PT CIPTA BUANA SAMUDRA | PT. CBS |
| PT PUTRA RIMBA NUSANTARA | PT. PRN |
| PT MUSI NAULI LESTARI | PT. MNL |
| PT SUMBER HIJAU PERMAI | PT. SHP |

**Implementasi**: collection `contractors` di MongoDB dengan field `{ fullName, shortName }`. Atau hardcode mapping awal + admin UI untuk edit. Di demo: helper `shortName()` di `demo/app.js`.

### 9. Validasi parameter (page 2)

> Dari pptx Perencanaan Update.

- ID Kanal di parameter HARUS = Canal ID di kedalaman (page 3)
- Panjang kanal parameter HARUS = Σ STA di kedalaman
- Measure Point WAJIB tanpa spasi
- Operation No default `0010` — warning kalau berbeda (tidak block)
- Max 3 angka di belakang titik untuk `water_level`, `tranducer`, `bed_float`, `depth_correction`

Indikator validasi (di demo): badge merah / jingga / hijau di samping field + summary di sidebar.

## Koordinat (UTM 48S)

- AOI pakai **UTM zona 48S** (Sumatera Selatan)
- EPSG: **32748**
- Proj4 string: `+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs`

Untuk peta Leaflet, perlu convert UTM → WGS84 (lat/lng) pakai library [`proj4js`](https://github.com/proj4js/proj4js).

Untuk export "Request PAT" — keep koordinat di UTM (X/Y) sesuai input. Tidak perlu convert balik.

## Sample data (dari Excel asli WM)

```
District               | Order No    | Req Date   | Type | Canal ID | Pjg  | Dim    | MP     | Start      | Finish     | Contractor                | X      | Y       | Status
D.SUNGAI_BEYUKU        | 2000349188  | 2026-05-17 | QC   | SB180200 | 1000 | 8X5X3  | 382955 | 2026-05-01 | 2026-05-31 | PT CIPTA BUANA SAMUDRA    | 540840 | 9674337 | Submitted
D.SUNGAI_BEYUKU        | 2000349189  | 2026-05-17 | QC   | SB180202 | 1000 | 8X5X3  | 382956 | 2026-05-01 | 2026-05-31 | PT CIPTA BUANA SAMUDRA    | 540840 | 9673402 | Submitted
D.SUNGAI_BEYUKU        | 2000349190  | 2026-05-17 | QC   | SB180204 | 998  | 8X5X3  | 382957 | 2026-05-01 | 2026-05-31 | PT CIPTA BUANA SAMUDRA    | 540869 | 9672320 | Submitted
D.SUNGAI_PENYABUNGAN   | 2000348941  | 2026-05-17 | QC   | SP223200 | 1107 | 10X7X3 | 382373 | 2026-05-01 | 2026-05-31 | PT PUTRA RIMBA NUSANTARA  | 544264 | 9653212 | Submitted
D.SUNGAI_PENYABUNGAN   | 2000348942  | 2026-05-17 | QC   | SP223204 | 1016 | 10X7X3 | 382375 | 2026-05-01 | 2026-05-31 | PT PUTRA RIMBA NUSANTARA  | 546259 | 9653944 | Submitted
D.SUNGAI_PENYABUNGAN   | 2000349398  | 2026-05-17 | QC   | SPFB1400 | 1009 | 8X5X3  | 382999 | 2026-05-01 | 2026-05-31 | PT MUSI NAULI LESTARI     | 548226 | 9654589 | Submitted
```

Demo mockup pakai data ini + variasi tambahan untuk demo deadline countdown (request date 2026-05-13 → LEWAT, 2026-05-14 → deadline hari ini).

## Feedback log

| Tanggal | Sumber | Inti feedback | Status |
|---|---|---|---|
| 2025-12-18 | PPTX `Perencanaan Update Software QC Kanal` | Bulk select, drag rounding, server-render chart, ChartPreview, bulk excel page 3 | ✅ Sudah di app lama |
| 2025-12-18 | PPTX (belum direalisasi di app lama) | Excel page 2 export, nested DB optimization, login session, district by region, detail di chart | ✅ Masuk roadmap app baru |
| 2026-05-18 | Fathul (user repo) | App baru pendekatan undangan + jadwal + offline-first, PouchDB | ✅ Demo done |
| 2026-05-18 | WM (klien) | Order No per canal, Measure Point + Coord wajib, deadline 5 hr, multi-district grouping, QC Date vs Measure Date clamp | ✅ Demo done |

Detail histori feedback ada di [`FEEDBACK.md`](./FEEDBACK.md).
