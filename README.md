# new-hydro-canal

Platform operasi & QC kanal — penerus [fullstack-hydrocanal-graph](https://github.com/luhtaf/fullstack-hydrocanal-graph). App QC Kanal yang sudah ada akan menjadi salah satu modul; di atasnya ditambah **alur undangan → jadwal → penugasan → input lapangan (offline-first)**.

## Status

🚧 **Phase 0 — Planning & UI mockup.** Belum ada kode produksi.

Mockup MVP-nya ada di [`demo/`](./demo) — single-page app static, drag-drop ke Netlify atau buka lokal.

## Kenapa app baru?

App existing efektif sebagai **QC processing tool**, tapi tidak mencakup:

- Penerimaan undangan QC dari klien/kontraktor
- Kalender agenda + jadwal penugasan
- Input parameter & data kedalaman **di lapangan** (sering tanpa sinyal)
- Manajemen distrik per region (kode distrik bisa duplikat antar region)
- Login + role (admin vs operator)

App baru menyelesaikan itu, dan QC processing engine existing tetap di-reuse sebagai modul.

## Arsitektur target

```
┌─ Client (React + PouchDB) ──────────────────────────┐
│  • UI ops (undangan, jadwal, penugasan)             │
│  • Form lapangan dengan PouchDB local cache         │
│  • Chart.js drag-edit (existing)                    │
└────────────┬────────────────────────────────────────┘
             │ REST sync (timestamp-based, per-doc)
             ↓
┌─ Backend (Express + MongoDB) ───────────────────────┐
│  • Pertahankan schema existing                      │
│  • Tambah: User, Undangan, Penugasan, Region        │
│  • Endpoint sync untuk PouchDB                      │
└─────────────────────────────────────────────────────┘
```

**Kenapa PouchDB + REST, bukan CouchDB penuh?** Schema `Data > canal_data[] > data[]` deeply-nested. Drag-edit per titik di CouchDB akan bikin revision tree membengkak. PouchDB di client + REST sync lebih aman: pertahankan backend existing, manual conflict resolution UI sudah dimodel di demo.

## Domain model — AOI / Undangan (revisi per feedback WM, 18 Mei 2026)

Sumber kebenaran: Excel **"AOI QC Canal USV Notification"** dari WM.

**Header AOI:** Region (mis. Palembang) · Area (mis. SUMSEL P1) · Vendor pelaksana (mis. PT. KARTA BHUMI NUSANTARA).

**Tiap baris = 1 Canal ID, dengan Order No sendiri-sendiri** (BUKAN 1 order untuk seluruh undangan). Kolom per baris:

| Field | Catatan |
|---|---|
| District | mis. `D.SUNGAI_BEYUKU` |
| Order No | unik per Canal ID, mis. `2000349189` |
| Request Date | acuan deadline |
| Request Type | `QC` / `RE-QC` |
| Canal ID | mis. `SB180202` |
| Panjang, Dimensi | mis. 1000 m, `8X5X3` |
| Measure Point | numerik, mis. `382956` (tanpa spasi) |
| Start Date / Finish Date | masa SPK |
| Contractor Name | mis. `PT CIPTA BUANA SAMUDRA` (disingkat di chart) |
| Coordinate X / Y | UTM zona 48S |
| Status | `Submitted` → `Assigned` → `In Progress` → `Done` |

**Aturan turunan:**

- **Deadline = Request Date + 4 hari** (hari undangan masuk dihitung sebagai hari ke-1, maks 5 hari kerja). Tampilkan countdown + status LEWAT.
- **Penugasan** = subset canal yang di-assign ke operator. Satu operator bisa pegang **>1 kontraktor & >1 distrik sekaligus** → UI grouping **Kontraktor → Distrik** dengan ringkasan (jumlah kanal, total meter, deadline terdekat).
- **Parameter** punya 2 tanggal: **QC Date/Budat** (tanggal pengolahan s/d upload) dan **Measure Date** (tanggal pengukuran). Jika tanggal pengukuran asli **melewati Finish Date AOI**, Measure Date di-clamp ke Finish Date.
- Penamaan output QC tetap `[district]-[YYMMDD]-[usv]-[urut][rev][qctype]`.

## Modul

| Modul | Status |
|---|---|
| Undangan QC (AOI per-canal Order No) | Planned · model di-finalisasi |
| Deadline tracker (Request Date + 5 hr) | Planned |
| Kalender & jadwal | Planned |
| Penugasan operator (grouped multi-distrik/kontraktor) | Planned |
| Input parameter (offline) + QC Date & Measure Date clamp | Planned |
| Input kedalaman + drag chart | Planned (reuse existing) |
| QC processing & export | **Reuse from existing repo** |
| District & region | Planned (extend existing) |
| Konflik sync resolution | Planned |
| Notifikasi | Planned |
| Map view penugasan | Planned |
| Reports / Audit log / User mgmt (admin) | Planned |

## Demo

```bash
cd demo
python3 -m http.server 8080
# → http://localhost:8080
```

Atau drag folder `demo/` ke <https://app.netlify.com/drop>.

Detail interaksi & arsitektur ada di [`demo/README.md`](./demo/README.md).

## Related

- App QC processing existing: [luhtaf/fullstack-hydrocanal-graph](https://github.com/luhtaf/fullstack-hydrocanal-graph)
- Source requirement: `Perencanaan Update Software QC Kanal.pptx` (di repo existing)
