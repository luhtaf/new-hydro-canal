/**
 * Test service User. Sebagian pure (deriveInitials) jalan tanpa Mongo; sisanya
 * integration (butuh mongodb-memory-server, di-SKIP otomatis kalau dep belum ada —
 * pola sama district.service.test).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

import { UserModel } from '../../shared/models/index.js';
import {
  createUser,
  deriveInitials,
  getUser,
  listUsers,
  resetPin,
  softDeleteUser,
  updateUser,
} from './user.service.js';

describe('deriveInitials (pure)', () => {
  it('dua kata → inisial depan+belakang', () => {
    expect(deriveInitials('Sari Putri')).toBe('SP');
    expect(deriveInitials('Fathul Akmal Hidayat')).toBe('FH');
  });
  it('satu kata → 2 huruf pertama', () => {
    expect(deriveInitials('Budi')).toBe('BU');
  });
  it('trim spasi berlebih', () => {
    expect(deriveInitials('  andi   saputra ')).toBe('AS');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MongoMemoryServer: any = null;
try {
  ({ MongoMemoryServer } = await import('mongodb-memory-server' as string));
} catch {
  MongoMemoryServer = null;
}

const d = MongoMemoryServer ? describe : describe.skip;

d('user.service (integration)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mem: any;

  beforeAll(async () => {
    mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mem.stop();
  });

  it('create operator + auto-inisial + pinHash tak bocor', async () => {
    const u = await createUser({
      name: 'Sari Putri',
      email: 'SARI@hydrocanal.id',
      pin: '1234',
      role: 'operator',
      usv: 'KBN04',
    });
    expect(u.email).toBe('sari@hydrocanal.id'); // lowercased
    expect(u.initials).toBe('SP');
    expect(u.usv).toBe('KBN04');
    expect((u as unknown as Record<string, unknown>).pinHash).toBeUndefined();
  });

  it('operator tanpa USV ditolak', async () => {
    await expect(
      createUser({ name: 'X', email: 'x@a.id', pin: '1234', role: 'operator' }),
    ).rejects.toThrow();
  });

  it('admin dipaksa usv null walau dikirim', async () => {
    const u = await createUser({
      name: 'Super Admin',
      email: 'admin@a.id',
      pin: '123456',
      role: 'admin',
      usv: 'KBN01',
    });
    expect(u.usv).toBeNull();
  });

  it('email duplikat ditolak', async () => {
    await createUser({ name: 'A', email: 'dup@a.id', pin: '1234', role: 'operator', usv: 'KBN01' });
    await expect(
      createUser({ name: 'B', email: 'dup@a.id', pin: '1234', role: 'operator', usv: 'KBN02' }),
    ).rejects.toThrow();
  });

  it('PIN invalid ditolak', async () => {
    await expect(
      createUser({ name: 'A', email: 'p@a.id', pin: '12', role: 'operator', usv: 'KBN01' }),
    ).rejects.toThrow();
  });

  it('update partial + ganti role admin→operator butuh usv', async () => {
    const u = await createUser({
      name: 'Rendi', email: 'r@a.id', pin: '1234', role: 'admin',
    });
    const updated = await updateUser(u.id, { status: 'cuti' });
    expect(updated?.status).toBe('cuti');
    await expect(updateUser(u.id, { role: 'operator' })).rejects.toThrow(); // tanpa usv
    const ok = await updateUser(u.id, { role: 'operator', usv: 'KBN03' });
    expect(ok?.role).toBe('operator');
    expect(ok?.usv).toBe('KBN03');
  });

  it('soft delete: revoked + tokenVersion naik + hilang dari list default', async () => {
    const u = await createUser({ name: 'Z', email: 'z@a.id', pin: '1234', role: 'operator', usv: 'KBN05' });
    expect(await softDeleteUser(u.id)).toBe(true);
    const list = await listUsers();
    expect(list.find((x) => x.id === u.id)).toBeUndefined();
    const all = await listUsers({ includeRevoked: true });
    const found = all.find((x) => x.id === u.id);
    expect(found?.revoked).toBe(true);
    expect(found?.tokenVersion).toBe(u.tokenVersion + 1);
  });

  it('reset PIN naikkan tokenVersion + un-revoke', async () => {
    const u = await createUser({ name: 'P', email: 'pin@a.id', pin: '1234', role: 'operator', usv: 'KBN01' });
    await softDeleteUser(u.id);
    expect(await resetPin(u.id, '9999')).toBe(true);
    const after = await getUser(u.id);
    expect(after?.revoked).toBe(false);
    expect(after?.tokenVersion).toBe(u.tokenVersion + 2);
  });
});
