/**
 * Flow 01 — Login multi-akun → dashboard (spec § C + § E).
 *
 * - Login admin online (enroll pertama wajib online).
 * - Tambah akun operator di device yang sama (AccountSwitcher → "Tambah akun").
 * - Switch antar-akun (operator enrolled → boleh switch).
 * - Tiap akun mendarat di dashboard (greeting nama).
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS } from './support/accounts.js';
import {
  loginViaUi,
  expectOnDashboard,
  switchAccount,
} from './support/helpers.js';

test.describe('Login multi-akun', () => {
  test('admin login online → dashboard', async ({ page }) => {
    await loginViaUi(page, ACCOUNTS.admin);
    await expectOnDashboard(page, ACCOUNTS.admin);
  });

  test('tambah akun operator → switch antar-akun', async ({ page }) => {
    // Akun pertama: admin.
    await loginViaUi(page, ACCOUNTS.admin);
    await expectOnDashboard(page, ACCOUNTS.admin);

    // Tambah operator (add mode lewat AccountSwitcher).
    await loginViaUi(page, ACCOUNTS.operator, { addMode: true });
    await expectOnDashboard(page, ACCOUNTS.operator);

    // Switch balik ke admin (sudah enrolled — offline OK; di sini masih online).
    await switchAccount(page, ACCOUNTS.admin.email);
    await expectOnDashboard(page, ACCOUNTS.admin);
  });

  test('PIN salah ditolak', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await page.getByLabel('PIN', { exact: true }).fill('000000');
    await page.getByRole('button', { name: /masuk/i }).click();

    await expect(
      page.getByText(/salah|nonaktif|tidak valid/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
