/**
 * Global setup E2E — dijalankan SEKALI sebelum semua test (lihat playwright.config).
 *
 * Tugas:
 *   1. Tunggu server `/health` hijau (Mongo connected + seed admin first-boot jalan).
 *   2. Login admin via API → dapat session cookie.
 *   3. Provision akun operator (POST /users, admin-only) kalau belum ada — idempotent.
 *
 * Catatan: master data (districts/contractors) + default admin di-seed otomatis oleh
 * server saat first boot (seedAll di index.ts). Setup ini cuma menambah operator
 * supaya flow assign→penugasan punya target. Email/PIN cocok dgn support/accounts.ts.
 */
import { request, type FullConfig } from '@playwright/test';
import { ACCOUNTS } from './support/accounts.js';

const SERVER_PORT = Number(process.env.E2E_SERVER_PORT ?? 4000);
const SERVER_URL = process.env.E2E_SERVER_URL ?? `http://localhost:${SERVER_PORT}`;

async function waitForHealth(baseURL: string, timeoutMs = 60_000): Promise<void> {
  const ctx = await request.newContext({ baseURL });
  const deadline = Date.now() + timeoutMs;
  try {
    for (;;) {
      try {
        const res = await ctx.get('/health');
        if (res.ok()) return;
      } catch {
        /* server belum siap — retry */
      }
      if (Date.now() > deadline) {
        throw new Error(
          `Server /health tidak hijau dalam ${timeoutMs}ms. Pastikan Mongo jalan (docker compose up mongo) & MONGO_URI benar.`,
        );
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    await ctx.dispose();
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await waitForHealth(SERVER_URL);

  // Login admin (session cookie tersimpan di context ini).
  const admin = ACCOUNTS.admin;
  const ctx = await request.newContext({ baseURL: SERVER_URL });
  try {
    const login = await ctx.post('/auth/login', {
      data: { email: admin.email, pin: admin.pin },
    });
    if (!login.ok()) {
      throw new Error(
        `Login admin gagal (${login.status()}). Cek seed default admin / SEED_ADMIN_* env.`,
      );
    }

    // Provision operator (idempotent: 409/422 "sudah ada" diabaikan).
    const op = ACCOUNTS.operator;
    const create = await ctx.post('/users', {
      data: {
        name: op.name,
        email: op.email,
        pin: op.pin,
        role: op.role,
        usv: op.usv,
      },
    });
    if (!create.ok() && ![409, 422].includes(create.status())) {
      const body = await create.text();
      throw new Error(`Provision operator gagal (${create.status()}): ${body}`);
    }
  } finally {
    await ctx.dispose();
  }
}
