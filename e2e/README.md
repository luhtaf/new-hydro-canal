# E2E — Playwright (new-hydro-canal)

End-to-end test untuk 5 flow inti (spec `docs/superpowers/specs/2026-06-15-foundation-architecture-design.md` § E).
E2E butuh **stack runtime hidup** (server Express + MongoDB + client Vite) → sengaja
**TIDAK** ikut `npm run typecheck` / `npm test` workspace. Jalankan terpisah.

## Flow yang dites

| File | Flow |
|------|------|
| `01-login-multi-akun.spec.ts` | Login multi-akun (admin + tambah operator + switch) → dashboard |
| `02-import-undangan.spec.ts` | Import Excel AOI → list `/undangan` → detail `/undangan/:orderNo` |
| `03-assign-penugasan.spec.ts` | Admin assign canal → operator melihat di `/penugasan` (grouped) |
| `04-offline-parameter-sync.spec.ts` | Offline → input parameter (tulis Pouch + outbox) → online → sync (badge ✅) |
| `05-drag-chart-kedalaman.spec.ts` | Seed titik STA → drag/edit kedalaman → persist + sync |

## Prasyarat (sekali)

1. **Install Playwright** (belum terpasang — lihat `missingDeps` di laporan task):

   ```bash
   npm install -D -w . playwright @playwright/test
   # atau dari root:
   npm install -D playwright @playwright/test
   ```

2. **Install browser engine** (Chromium dipakai; flow offline/drag butuh Chromium):

   ```bash
   npm run test:e2e:install      # = playwright install --with-deps chromium
   ```

## Cara jalanin

### 1) Nyalakan MongoDB dulu (wajib)

E2E pakai DB terpisah `hydrocanal_e2e` (lihat `playwright.config.ts` → `webServer.env.MONGO_URI`).
Pakai compose dev yang sudah ada — service `mongo` saja:

```bash
docker compose up -d mongo
```

> Server + client di-boot OTOMATIS oleh Playwright (`webServer` di config), lalu di-shutdown
> setelah selesai. Mongo TIDAK di-manage Playwright → harus sudah jalan duluan.

### 2) Jalankan test

```bash
npm run test:e2e            # headless, semua flow
npm run test:e2e:ui         # mode UI interaktif (debug)
npm run test:e2e:report     # buka HTML report terakhir
```

### Pakai stack yang sudah jalan (skip auto-boot)

Kalau kamu sudah `npm run dev` manual (server :4000 + client :5173):

```bash
E2E_NO_WEBSERVER=1 npm run test:e2e
```

## Env yang bisa di-override

| Env | Default | Guna |
|-----|---------|------|
| `E2E_BASE_URL` | `http://localhost:5173` | URL client |
| `E2E_CLIENT_PORT` | `5173` | Port Vite |
| `E2E_SERVER_PORT` | `4000` | Port API |
| `E2E_MONGO_URI` | `mongodb://localhost:27017/hydrocanal_e2e` | DB test (pisah dari dev) |
| `E2E_NO_WEBSERVER` | – | `1` = jangan boot server/client (pakai yang sudah jalan) |
| `CI` | – | retry 2x, 1 worker, reporter github |

## Akun & data test

- `global-setup.ts` menunggu `/health` hijau, login **admin** (seed first-boot
  `admin@kartabhumi.id` / `123456`), lalu provision **operator** (`operator@kartabhumi.id`
  / `654321`, USV `KBN01`) via `POST /users` — idempotent.
- Master data (districts/contractors) di-seed server saat first boot.
- Fixture Excel AOI + CSV kedalaman **digenerate per-run** (`support/fixtures.ts`,
  pakai `xlsx`) dengan Order No random → aman dijalankan berulang (tak nabrak index
  unique `Canal.orderNo`). File tersimpan di `e2e/.artifacts/` (gitignored).

## Catatan desain test

- **Tanpa `data-testid`** — codebase belum pakai. Selektor target permukaan user:
  `getByRole` / `getByLabel` / teks Indonesia. Idiomatik & tahan refactor internal.
  Kalau nanti UI nambah `data-testid`, helper di `support/helpers.ts` bisa dipersempit.
- **Setup via API, verifikasi via UI** — flow 03/04/05 menyiapkan precondition
  (import + assign) lewat REST (`support/api.ts`) supaya cepat & deterministik, lalu
  assert lewat UI. Pola standar Playwright.
- **Offline (flow 04)** pakai CDP `context.setOffline()` → andal hanya di Chromium
  (test lain auto-skip di engine non-chromium). App bereaksi via listener
  `online`/`offline` (`shared/hooks/useOnline.ts`).
- **"Save" di flow 04/05** = spec § D jalur tulis tunggal: UI tulis ke PouchDB +
  outbox (bukan langsung server). Sukses = toast "antrian sync" + badge ⏳, lalu push
  saat online → badge ✅ (`expectFullySynced`).
- **Drag chart (flow 05)**: mencoba pointer-drag canvas Chart.js sungguhan, lalu
  memverifikasi lewat jalur persist yang SAMA (edit nilai depth di tabel → blur →
  `persistPoint`) karena drag-pixel pada canvas plugin rawan flaky.

## Struktur folder

```
e2e/
├── README.md                 # ini
├── tsconfig.json             # TS khusus E2E (terpisah dari typecheck workspace)
├── global-setup.ts           # tunggu /health + provision operator
├── 01..05-*.spec.ts          # 5 flow
└── support/
    ├── accounts.ts           # kredensial admin/operator deterministik
    ├── helpers.ts            # login/switch/offline/sync helpers (selector UI)
    ├── api.ts                # setup state via REST (login/import/assign)
    └── fixtures.ts           # generator .xlsx AOI + .csv kedalaman per-run
```
