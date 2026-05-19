# HydroCanal QC — Operations Mockup

SPA prototype untuk app ops baru yang membungkus QC processing existing sebagai salah satu modul. Tidak butuh build step.

## Cara jalanin lokal

```bash
# Folder static — sajikan dengan server statis apa pun
python3 -m http.server 8080 -d demo
# lalu buka http://localhost:8080
```

Atau drag-drop folder `demo/` ke Netlify (`https://app.netlify.com/drop`).

## Struktur file

```
demo/
├── index.html   — Struktur, template view, CDN imports
├── style.css    — Custom styles + dark mode + print + role + tour + modal
├── app.js       — Router, state, render, interaksi, role hierarchy, tour
└── README.md
```

## Halaman

| Route | Isi |
|---|---|
| `#/login` | Login operator (USV code + PIN) |
| `#/` | Dashboard admin — KPI, penugasan minggu ini, status QC |
| `#/kalender` | Kalender bulanan + **klik tanggal** → side panel agenda hari itu |
| `#/undangan` | **AOI list** — 1 baris/Canal ID + Order No sendiri, header Region/Area/Vendor, deadline countdown, filter Submitted/Assigned/In Progress/Done |
| `#/undangan/baru` | Wizard 4-step + auto-split kanal >999m |
| `#/undangan/detail` | Detail AOI per-canal (Measure Point, Coord UTM, SPK, deadline) + canal lain di kontraktor/distrik sama |
| `#/penugasan` | Tugas operator **di-group Kontraktor → Distrik** (jawaban: 1 operator bisa multi-distrik/kontraktor) + tab Aktif/Selesai |
| `#/penugasan/detail` | Ringkasan penugasan + Order No/MP/Coord/SPK + **mini map Leaflet** + progress + cuaca |
| `#/lapangan/parameter` | Form parameter + Coord UTM + **QC Date/Budat & Measure Date (auto-clamp ke Finish Date)** + validasi inline |
| `#/lapangan/kedalaman` | Tabel STA + Chart.js drag + drop-zone CSV + capture GPS |
| `#/peta` | **Leaflet map** semua penugasan + sample STA (warna threshold) |
| `#/qc` | Module existing — bulk export PNG/Excel/TXT/UTM |
| `#/konflik` | Resolusi konflik sync — pilih versi per dokumen / per field |
| `#/distrik` | Distrik dikelompokkan per region |
| `#/notifikasi` | Inbox notifikasi (unread badge di sidebar) |
| `#/pengaturan` | Threshold slider live (admin-only lock) + toggle setting + reset lokal |
| `#/users` | **Operator & akun** (admin-only) — table dengan produktivitas, role, USV |
| `#/reports` | **Reports & Analytics** (admin-only) — Chart.js line trend + bar per region + donut + tabel operator |
| `#/audit` | **Audit log** (admin-only) — timeline siapa-apa-kapan dengan filter user/action |
| `#/help` | **Bantuan** — shortcuts, glossary STA/tranducer/dll, FAQ, kontak |

## Model AOI / Undangan (revisi feedback WM)

Demo ini sudah pakai struktur Excel "AOI QC Canal USV Notification" yang asli:

- **1 baris = 1 Canal ID**, tiap canal punya **Order No sendiri** (mis. `2000349189`) — bukan 1 order per undangan
- Header AOI: **Region** Palembang · **Area** SUMSEL P1 · **Vendor** PT. KARTA BHUMI NUSANTARA
- Field: District, Request Date, Request Type, Panjang, Dimensi, **Measure Point**, Start/Finish Date (SPK), Contractor, **Coordinate X/Y (UTM)**, Status (Submitted/Assigned/In Progress/Done)
- **Deadline = Request Date + 4 hari** (hari masuk = hari ke-1, maks 5 hari). Countdown badge: "Sisa N hari" / "Deadline hari ini" / "LEWAT". Demo "today" = 2026-05-18 (stabil).
- **Penugasan** di-group **Kontraktor → Distrik** — menjawab pertanyaan WM: 1 operator bisa pegang banyak kontraktor & distrik sekaligus; tiap grup punya ringkasan (jumlah kanal, total meter, deadline terdekat).
- **Parameter** punya **QC Date/Budat** (tgl olah s/d upload) + **Measure Date** (tgl ukur). Coba isi Measure Date > 31 Mei 2026 → auto-clamp ke Finish Date dengan warning.

## Role hierarchy

- **Operator** (default) — lihat dashboard personal, kalender, undangan (read), penugasan saya, lapangan, QC, notif, peta. Pengaturan threshold di-lock.
- **Admin / Manager** — semua di atas + buat undangan, manage operator, reports, audit log, distrik & region, edit threshold.

Toggle via role pill di top-right (di-persist ke localStorage). Operator yang akses URL admin-only (mis. `#/users`) di-redirect ke "Akses terbatas" page dengan tombol switch.

## Interaksi yang beneran jalan

- 🌗 **Dark mode** — tombol bulan/matahari di top-right, **tersimpan** lintas refresh
- ⌘ **Cmd+K / Ctrl+K** — command palette, fuzzy search semua page + actions, arrow keys + enter
- 🔌 **Online/Offline toggle** — banner kuning, queue badge update
- 💾 **localStorage persistence** — queue, threshold, settings, dark mode, drag-edit kedalaman, status notif → **bertahan setelah refresh**
- 🔎 **Search undangan live** — ketik di kolom search, tabel filter realtime + tab filter status
- 📅 **Klik tanggal kalender** → side panel daftar event hari itu (color-coded)
- 📊 **Drag bar Chart.js** di `#/lapangan/kedalaman` — perubahan tersimpan ke localStorage, threshold annotation lines update otomatis, row & status badge ikut update
- 🎚️ **Threshold slider** di Pengaturan — geser → chart kedalaman langsung re-color & garis annotation ikut bergeser
- 🗺️ **Leaflet map** — pin per penugasan dengan ID kanal, klik popup info, marker STA color-coded per threshold
- 📍 **Capture GPS** — pakai `navigator.geolocation` real (perlu izin browser)
- 📂 **Drag-drop import CSV** — di `#/lapangan/kedalaman`, drag file ke drop zone, parse, masuk queue
- 🖨️ **Print** — `Cmd+P` di halaman penugasan detail / undangan detail → layout print-friendly (nav hidden)
- 🔔 **Notifikasi inbox** — klik notif tandai dibaca, badge di sidebar update
- 🔄 **Force sync** — pengiriman antrian saat online
- 📱 **Mobile responsive** — bottom tab nav (Home/Kalender/Tugas/Peta/Akun) + sidebar collapse
- 🛡️ **Role switcher** — pill admin/operator di top-right, nav links hide/show, threshold form lock, persisted
- 🎓 **Walkthrough tour** — 8-step overlay, auto-trigger first visit, ulang dari tombol Tour atau ⌘K → "tour"
- 💬 **Confirmation modal** — destructive actions (reset lokal, dll) pakai dialog kustom, bukan native `confirm()`
- ⏰ **Live clock** — jam ticking di top nav, hari/tanggal otomatis
- ⚡ **Trigger konflik (demo)** — di `#/konflik` tombol "Trigger konflik baru" generate konflik real-time
- 💾 **Real file export** — `#/qc` tombol TXT/CSV/PNG/Excel **beneran download file** (Excel pakai SheetJS, PNG pakai Canvas, dll)
- ✅ **Form validation real-time** — di undangan baru, Order No pattern check + Operation No warning
- 🔗 **Chain undangan → penugasan → QC** — link bi-directional: undangan detail tampil penugasan terkait, penugasan detail tampil "Dari undangan" + output QC, QC card tampil "Sumber: PAT-XXXX"
- 🔢 **Browser tab badge** — `document.title` update sesuai jumlah notif unread (lihat tab browser)

## Catatan arsitektur (untuk diskusi)

- **PouchDB di client** untuk cache: penugasan, master district, threshold, draft input
- **REST sync** ke backend MongoDB existing — kirim per dokumen pakai timestamp-based conflict resolution
- **Bukan CouchDB** karena schema `Data > canal_data[] > data[]` deep-nested, drag-edit per titik akan bikin revision tree CouchDB membengkak

## Hal yang belum di-mockup (sengaja)

- Approval flow undangan (siapa approve sebelum assign)
- Form tambah/edit distrik (cuma list view)
- Real auth/permission gating (mock pakai role state lokal)
- Map editing (placing pin manual)
- Multi-user presence indicator

## Dependencies (semua via CDN — no build)

- Tailwind CSS (3.x play CDN)
- Inter font + JetBrains Mono (Google Fonts)
- Lucide icons (UMD)
- Chart.js 4.4.1 + plugin-annotation 3 + plugin-dragdata 2.3.1
- Leaflet 1.9.4 + CARTO Voyager tiles
