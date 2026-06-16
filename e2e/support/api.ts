/**
 * Helper API E2E — setup state lewat REST (server-side) untuk mempercepat &
 * mendeterministik-kan precondition test (import AOI, assign canal, ambil userId).
 *
 * Idiomatik Playwright: setup data via API, verifikasi via UI. Pakai
 * APIRequestContext terpisah dengan session cookie sendiri (admin / operator).
 */
import { request, type APIRequestContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { E2eAccount } from './accounts.js';

const SERVER_PORT = Number(process.env.E2E_SERVER_PORT ?? 4000);
export const SERVER_URL = process.env.E2E_SERVER_URL ?? `http://localhost:${SERVER_PORT}`;

export interface ApiSession {
  ctx: APIRequestContext;
  userId: string;
  dispose: () => Promise<void>;
}

/** Login via API → context ber-cookie + userId akun. */
export async function apiLogin(acct: E2eAccount): Promise<ApiSession> {
  const ctx = await request.newContext({ baseURL: SERVER_URL });
  const res = await ctx.post('/auth/login', {
    data: {
      email: acct.email,
      pin: acct.pin,
      ...(acct.usv ? { usv: acct.usv } : {}),
    },
  });
  if (!res.ok()) {
    throw new Error(`apiLogin gagal untuk ${acct.email} (${res.status()})`);
  }
  const body = (await res.json()) as { user: { userId: string } };
  return {
    ctx,
    userId: body.user.userId,
    dispose: () => ctx.dispose(),
  };
}

/** Import file AOI .xlsx via POST /aoi/import (admin). Return ringkasan server. */
export async function apiImportAoi(
  ctx: APIRequestContext,
  filePath: string,
): Promise<{ imported: number; raw: unknown }> {
  const buffer = await readFile(filePath);
  const res = await ctx.post('/aoi/import', {
    multipart: {
      file: {
        name: basename(filePath),
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer,
      },
    },
  });
  if (!res.ok()) {
    throw new Error(`apiImportAoi gagal (${res.status()}): ${await res.text()}`);
  }
  const raw = await res.json();
  const imported =
    (raw as { imported?: number; inserted?: number }).imported ??
    (raw as { inserted?: number }).inserted ??
    0;
  return { imported, raw };
}

/** Assign bulk canal ke operator (admin). assignedTo = User._id (ObjectId 24-hex). */
export async function apiAssignCanals(
  ctx: APIRequestContext,
  body: { orderNos: string[]; assignedTo: string; usv: string },
): Promise<void> {
  const res = await ctx.post('/canals/assign', { data: body });
  if (!res.ok()) {
    throw new Error(`apiAssignCanals gagal (${res.status()}): ${await res.text()}`);
  }
}
