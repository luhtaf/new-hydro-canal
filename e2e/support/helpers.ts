/**
 * Helper E2E reusable: login, logout, navigasi, util offline.
 *
 * Selektor sengaja pakai role/label/teks (Indonesian) karena codebase TIDAK pakai
 * data-testid — kita target permukaan yang dilihat user (idiomatik Playwright,
 * tahan refactor internal). Kalau nanti UI menambah data-testid, helper ini boleh
 * dipersempit.
 */
import { expect, type Page } from '@playwright/test';
import type { E2eAccount } from './accounts.js';

/**
 * Login lewat UI `/login` (enroll/add account, spec § C wajib online).
 * `addMode` → buka via AccountSwitcher "Tambah akun" supaya akun ditumpuk
 * di device yang sama (test multi-akun) alih-alih sesi bersih.
 */
export async function loginViaUi(
  page: Page,
  acct: E2eAccount,
  opts: { addMode?: boolean } = {},
): Promise<void> {
  if (opts.addMode) {
    await openAccountSwitcher(page);
    await page.getByRole('menuitem', { name: /tambah akun/i }).click();
  } else {
    await page.goto('/login');
  }

  await expect(page.getByRole('heading', { name: /hydrocanal qc/i })).toBeVisible();

  await page.getByLabel('Email').fill(acct.email);
  // USV select opsional (admin = "— (admin / tanpa USV)").
  const usvValue = acct.usv === '' ? '' : acct.usv;
  await page.getByLabel('USV Code').selectOption(usvValue);
  await page.getByLabel('PIN', { exact: true }).fill(acct.pin);

  await page.getByRole('button', { name: /masuk/i }).click();
}

/**
 * Tunggu sampai dashboard (`/`) ter-render. Greeting memuat nama depan akun.
 * App-lock PIN ON by default → kalau muncul setup PIN gembok, set & lewati.
 */
export async function expectOnDashboard(page: Page, acct: E2eAccount): Promise<void> {
  await maybeSetupAppLock(page, acct.pin);
  await expect(page).toHaveURL(/\/$|\/#?$/);
  // Greeting: "<salam>, <FirstName>." — assert nama depan muncul di h1.
  const firstName = acct.name.split(' ')[0];
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: new RegExp(firstName, 'i') }),
  ).toBeVisible();
}

/**
 * App-lock gembok (spec § C, ON by default). Setelah login pertama, kalau PIN
 * gembok belum di-set, app minta setup. Set pakai PIN akun supaya deterministik.
 * No-op kalau layar lock tidak muncul (gembok dimatikan / sudah ter-set).
 */
export async function maybeSetupAppLock(page: Page, pin: string): Promise<void> {
  const lockScreen = page.getByRole('dialog', { name: /gembok|kunci|app.?lock/i });
  if (await lockScreen.isVisible().catch(() => false)) {
    const pinInputs = lockScreen.getByRole('textbox');
    // Set + konfirmasi PIN gembok (dua field kalau setup; satu kalau unlock).
    const count = await pinInputs.count();
    for (let i = 0; i < count; i++) await pinInputs.nth(i).fill(pin);
    await lockScreen.getByRole('button', { name: /simpan|set|buka|unlock/i }).click();
  }
}

/** Buka dropdown multi-akun di TopNav (avatar / inisial). */
export async function openAccountSwitcher(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /akun|account|profil|switch/i })
    .first()
    .click();
}

/** Switch ke akun lain yang sudah enrolled (offline OK). */
export async function switchAccount(page: Page, email: string): Promise<void> {
  await openAccountSwitcher(page);
  await page.getByRole('menuitem', { name: new RegExp(email, 'i') }).click();
}

export async function logout(page: Page): Promise<void> {
  await openAccountSwitcher(page);
  await page.getByRole('menuitem', { name: /keluar|logout/i }).click();
}

/** Toggle koneksi via CDP (Chromium). Flow offline test 04. */
export async function setOffline(page: Page, offline: boolean): Promise<void> {
  await page.context().setOffline(offline);
  // Bantu app yang dengar `navigator.onLine` / event 'online'|'offline'.
  await page.evaluate((o) => {
    window.dispatchEvent(new Event(o ? 'offline' : 'online'));
  }, offline);
}

/**
 * Tunggu sampai indikator sync per-akun menunjukkan "full sync" (pending 0).
 * SyncBadge: ✅ (aria-label "Full sync") saat pending 0, ⏳ N saat ada antrian.
 */
export async function expectFullySynced(page: Page): Promise<void> {
  await expect(page.getByLabel('Full sync')).toBeVisible({ timeout: 30_000 });
}
