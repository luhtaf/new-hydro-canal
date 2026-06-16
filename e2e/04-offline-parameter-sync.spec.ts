/**
 * Flow 04 — Offline → input parameter → online → sync (spec § D + § E).
 *
 * Inti spec § D: SATU jalur tulis. UI hanya tulis ke PouchDB (online maupun
 * offline). Sync engine memindahkan ke server di belakang layar.
 *
 *   1. Operator login (online — enroll wajib online).
 *   2. Browser → OFFLINE (CDP setOffline).
 *   3. Buka form parameter canal yang di-assign → Simpan.
 *      → tertulis ke Pouch + masuk outbox → badge "⏳ N belum terkirim".
 *   4. Browser → ONLINE → sync engine push outbox → badge "✅ full sync".
 *
 * Butuh Chromium (CDP setOffline). assignment di-setup via API supaya form
 * prefill (orderNo/canalId/measurePoint/dll) valid → Simpan langsung sukses.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS } from './support/accounts.js';
import {
  loginViaUi,
  expectOnDashboard,
  setOffline,
  expectFullySynced,
} from './support/helpers.js';
import { generateAoiFixture } from './support/fixtures.js';
import { apiLogin, apiImportAoi, apiAssignCanals } from './support/api.js';

test.describe('Offline parameter → sync', () => {
  test('input parameter offline lalu sync saat online', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP setOffline hanya andal di Chromium');

    const aoi = await generateAoiFixture({ count: 1 });

    // --- Setup: import + assign ke operator (via API) ---
    const admin = await apiLogin(ACCOUNTS.admin);
    const operator = await apiLogin(ACCOUNTS.operator);
    try {
      await apiImportAoi(admin.ctx, aoi.filePath);
      await apiAssignCanals(admin.ctx, {
        orderNos: aoi.orderNos,
        assignedTo: operator.userId,
        usv: ACCOUNTS.operator.usv || 'KBN01',
      });
    } finally {
      await admin.dispose();
      await operator.dispose();
    }

    // --- Operator login (online) ---
    await loginViaUi(page, ACCOUNTS.operator);
    await expectOnDashboard(page, ACCOUNTS.operator);

    // Pre-warm: buka form sekali online supaya assignment ke-cache di Pouch,
    // lalu pastikan baseline tersinkron sebelum kita putus jaringan.
    await page.goto(`/lapangan/parameter/${aoi.firstOrderNo}`);
    await expect(
      page.getByRole('heading', { name: /parameter/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expectFullySynced(page);

    // --- GO OFFLINE ---
    await setOffline(page, true);
    // Banner/badge offline muncul (demo touch: indikator koneksi).
    await expect(page.getByText(/offline|tidak.*tersambung|tanpa koneksi/i).first()).toBeVisible();

    // Isi minimal & Simpan (form sudah prefill dari assignment).
    // Measure Date selalu ada default hari ini; cukup klik Simpan.
    await page.getByRole('button', { name: /^simpan$/i }).click();

    // Toast konfirmasi tulis lokal + masuk antrian sync.
    await expect(
      page.getByText(/disimpan ke perangkat|antrian sync/i),
    ).toBeVisible();

    // Badge sync per-akun: ada N belum terkirim (⏳, bukan full sync).
    await expect(page.getByText(/belum terkirim/i).or(page.getByLabel(/menunggu|pending/i))).toBeVisible();

    // --- GO ONLINE → sync engine push outbox ---
    await setOffline(page, false);

    // Badge kembali "✅ full sync" (outbox terkuras).
    await expectFullySynced(page);
  });
});
