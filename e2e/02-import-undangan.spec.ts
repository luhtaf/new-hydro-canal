/**
 * Flow 02 — Import AOI/undangan → list → detail (spec § E).
 *
 * Admin import Excel AOI → baris canal muncul di /undangan → klik order no →
 * /undangan/:orderNo render detail. Fixture .xlsx digenerate per-run (order no
 * random) supaya idempotent terhadap index unique Canal.orderNo.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS } from './support/accounts.js';
import { loginViaUi, expectOnDashboard } from './support/helpers.js';
import { generateAoiFixture } from './support/fixtures.js';

test.describe('Import undangan AOI', () => {
  test('admin import Excel → list → detail', async ({ page }) => {
    const aoi = await generateAoiFixture({ count: 3 });

    await loginViaUi(page, ACCOUNTS.admin);
    await expectOnDashboard(page, ACCOUNTS.admin);

    // Buka list undangan.
    await page.goto('/undangan');
    await expect(
      page.getByRole('heading', { name: /undangan qc kanal/i }),
    ).toBeVisible();

    // Buka dialog import + upload file (input file tersembunyi → setInputFiles).
    await page.getByRole('button', { name: /import excel aoi/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /import excel aoi/i });
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="file"]').setInputFiles(aoi.filePath);

    // Ringkasan hasil import (jumlah baris ter-import) muncul.
    await expect(dialog.getByText(/\b3\b/)).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole('button', { name: /selesai|tutup|done/i }).click();

    // Baris canal pertama muncul di list (order no atau canal id).
    const firstOrder = aoi.firstOrderNo;
    await expect(page.getByText(firstOrder)).toBeVisible({ timeout: 15_000 });

    // Navigasi ke detail by order no.
    await page.getByText(firstOrder).first().click();
    await expect(page).toHaveURL(new RegExp(`/undangan/${firstOrder}`));
    await expect(page.getByText(firstOrder)).toBeVisible();
    await expect(page.getByText(/canal-e2e-1/i)).toBeVisible();
  });
});
