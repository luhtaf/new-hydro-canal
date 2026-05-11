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
| `#/undangan` | List work order — **search live** + filter status |
| `#/undangan/baru` | Wizard 4-step + auto-split kanal >999m |
| `#/undangan/detail` | Detail undangan + assign petugas + timeline |
| `#/penugasan` | Tugas operator (card view) → klik buka detail |
| `#/penugasan/detail` | Ringkasan penugasan + **mini map Leaflet** + progress steps + cuaca |
| `#/lapangan/parameter` | Form parameter QC dengan validasi inline |
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
