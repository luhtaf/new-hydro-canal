/**
 * Flow 03 — Assign canal → operator lihat di penugasan (spec § E).
 *
 * Precondition (via API, deterministik): admin import AOI baru + assign ke operator.
 * Verifikasi (via UI): operator login → /penugasan → canal yang di-assign muncul,
 * dikelompokkan per Kontraktor → Distrik (DOMAIN poin grouping).
 *
 * assignedTo = User._id operator (ambil via apiLogin). usv = USV operator.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS } from './support/accounts.js';
import { loginViaUi, expectOnDashboard } from './support/helpers.js';
import { generateAoiFixture } from './support/fixtures.js';
import { apiLogin, apiImportAoi, apiAssignCanals } from './support/api.js';

test.describe('Assign → penugasan operator', () => {
  test('admin assign canal → operator melihatnya di /penugasan', async ({ page }) => {
    const aoi = await generateAoiFixture({ count: 2 });

    // --- Setup via API ---
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

    // --- Verifikasi via UI sebagai operator ---
    await loginViaUi(page, ACCOUNTS.operator);
    await expectOnDashboard(page, ACCOUNTS.operator);

    await page.goto('/penugasan');
    await expect(
      page.getByRole('heading', { name: /penugasan saya/i }),
    ).toBeVisible();

    // Tab "aktif" default → canal yang baru di-assign muncul (by order no / canal id).
    await expect(page.getByText(aoi.firstOrderNo)).toBeVisible({ timeout: 15_000 });

    // Grouping: nama kontraktor sebagai section header.
    await expect(page.getByText(new RegExp(aoi.contractor, 'i'))).toBeVisible();

    // Klik canal card → detail penugasan.
    await page.getByText(aoi.firstOrderNo).first().click();
    await expect(page).toHaveURL(/\/penugasan\//);
  });
});
