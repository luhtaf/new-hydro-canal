/**
 * Flow 05 — Drag chart kedalaman → save (spec § E).
 *
 * Halaman /lapangan/kedalaman/:orderNo: tabel STA + DepthChart (Chart.js +
 * chartjs-plugin-dragdata). Spec § D jalur tulis tunggal: drag bar → onCommit →
 * tulis depth doc ke PouchDB → masuk outbox → sync. TIDAK ada tombol "Save"
 * eksplisit; commit = aksi (drag selesai / edit nilai). "save" = persist lokal +
 * antrian sync, lalu push saat online.
 *
 * Strategi:
 *   1. Seed titik STA via DropZone import (CSV) — deterministik.
 *   2. Coba REAL drag pada canvas chart (intent utama "drag chart").
 *   3. Verifikasi commit lewat toast + badge sync. Sebagai jalur save deterministik
 *      (fungsi persist yang SAMA dengan drag: `persistPoint`), edit nilai depth di
 *      tabel STA lalu blur → assert nilai tersimpan & tersinkron.
 *
 * Butuh assignment supaya canal valid; di-setup via API. Butuh Chromium untuk
 * pointer drag yang andal.
 */
import { test, expect } from '@playwright/test';
import { ACCOUNTS } from './support/accounts.js';
import {
  loginViaUi,
  expectOnDashboard,
  expectFullySynced,
} from './support/helpers.js';
import { generateAoiFixture, generateDepthCsv } from './support/fixtures.js';
import { apiLogin, apiImportAoi, apiAssignCanals } from './support/api.js';

test.describe('Drag chart kedalaman → save', () => {
  test('seed titik → drag/edit kedalaman → tersimpan & sync', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Pointer drag canvas andal di Chromium');

    const aoi = await generateAoiFixture({ count: 1 });
    const depthCsv = await generateDepthCsv({ count: 5 });

    // --- Setup: import + assign (via API) ---
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

    // --- Operator buka page kedalaman ---
    await loginViaUi(page, ACCOUNTS.operator);
    await expectOnDashboard(page, ACCOUNTS.operator);
    await page.goto(`/lapangan/kedalaman/${aoi.firstOrderNo}`);
    await expect(
      page.getByRole('heading', { name: /input kedalaman/i }),
    ).toBeVisible({ timeout: 15_000 });

    // --- 1) Seed titik STA via DropZone import (CSV) ---
    await page
      .getByRole('heading', { name: /import titik/i })
      .locator('xpath=ancestor::div[1]')
      .locator('input[type="file"]')
      .setInputFiles(depthCsv.filePath);

    // Tabel terisi 5 baris STA (chart juga muncul).
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5, { timeout: 15_000 });
    await expectFullySynced(page);

    // --- 2) REAL drag pada canvas chart (intent utama) ---
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (box) {
      // Seret bar pertama ke atas (drag ~40px) → koreksi kedalaman.
      const startX = box.x + box.width * 0.2;
      const startY = box.y + box.height * 0.6;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 40, { steps: 8 });
      await page.mouse.up();
    }

    // --- 3) Jalur save deterministik: edit depth di tabel STA → blur ---
    // (Fungsi persist sama dengan drag onCommit → `persistPoint`.)
    const firstDepthInput = rows.first().locator('input[type="number"]');
    await firstDepthInput.fill('2.750');
    await firstDepthInput.blur();

    // Toast konfirmasi commit (antrian sync / tersimpan).
    await expect(
      page.getByText(/tersimpan|antrian sync|disimpan|diperbarui/i).first(),
    ).toBeVisible();

    // Nilai persist → reload page → input depth = 2.750 (terbaca dari Pouch).
    await page.reload();
    const reloadedInput = page
      .locator('table tbody tr')
      .first()
      .locator('input[type="number"]');
    await expect(reloadedInput).toHaveValue('2.750');

    // Outbox terkuras saat online → full sync.
    await expectFullySynced(page);
  });
});
