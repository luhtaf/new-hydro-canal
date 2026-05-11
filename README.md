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

## Modul

| Modul | Status |
|---|---|
| Undangan QC | Planned |
| Kalender & jadwal | Planned |
| Penugasan operator | Planned |
| Input parameter (offline) | Planned |
| Input kedalaman + drag chart | Planned (reuse existing) |
| QC processing & export | **Reuse from existing repo** |
| District & region | Planned (extend existing) |
| Konflik sync resolution | Planned |
| Notifikasi | Planned |
| Map view penugasan | Planned |

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
