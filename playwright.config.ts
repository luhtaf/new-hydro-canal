/**
 * Playwright config — E2E new-hydro-canal (spec § E).
 *
 * Cakupan 5 flow (lihat e2e/README.md):
 *   1. login multi-akun → dashboard
 *   2. import AOI/undangan → list → detail
 *   3. assign canal → operator lihat di penugasan
 *   4. offline → input parameter → online → sync
 *   5. drag chart kedalaman → save
 *
 * E2E butuh STACK RUNTIME (server Express + Mongo + client Vite). Karena itu test
 * ini TIDAK dijalankan di CI unit/typecheck biasa — dijalankan terpisah lewat
 * `npm run test:e2e` setelah `docker compose up mongo` (lihat e2e/README.md).
 *
 * `webServer` di-array supaya Playwright boot server + client sendiri sebelum test,
 * dan men-shutdown setelah selesai. Mongo HARUS sudah jalan (compose) sebelum ini.
 *
 * Catatan offline: project default pakai Chromium (CDP `setOffline` jalan penuh).
 * Flow offline (test 04) butuh Chromium — di-skip otomatis di engine lain.
 */
import { defineConfig, devices } from '@playwright/test';

const CLIENT_PORT = Number(process.env.E2E_CLIENT_PORT ?? 5173);
const SERVER_PORT = Number(process.env.E2E_SERVER_PORT ?? 4000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${CLIENT_PORT}`;

// CI / reuse: kalau stack sudah dinyalakan manual (mis. `npm run dev`), set
// E2E_NO_WEBSERVER=1 supaya Playwright tidak boot ulang server/client.
const manageStack = process.env.E2E_NO_WEBSERVER !== '1';

export default defineConfig({
  testDir: './e2e',
  // Sekali sebelum semua test: tunggu /health + provision akun operator.
  globalSetup: './e2e/global-setup.ts',
  // Urutan flow penting (import dulu baru detail/assign) → file di-number 01..05.
  // Test DI DALAM satu file boleh paralel; antar-file fullyParallel dimatikan
  // supaya seed/state Mongo tidak balapan.
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: manageStack
    ? [
        {
          // Server Express (butuh Mongo sudah jalan via docker compose).
          command: 'npm run dev --workspace=server',
          port: SERVER_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
          env: {
            NODE_ENV: 'test',
            PORT: String(SERVER_PORT),
            MONGO_URI:
              process.env.E2E_MONGO_URI ??
              'mongodb://localhost:27017/hydrocanal_e2e',
            SESSION_SECRET: 'e2e-secret',
            CLIENT_ORIGIN: BASE_URL,
            // Seed admin deterministik supaya test login bisa pakai kredensial tetap.
            SEED_ADMIN_EMAIL: 'admin@kartabhumi.id',
            SEED_ADMIN_PIN: '123456',
          },
        },
        {
          // Client Vite (proxy /api → server).
          command: 'npm run dev --workspace=client',
          port: CLIENT_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ]
    : undefined,
});
