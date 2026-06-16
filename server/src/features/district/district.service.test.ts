/**
 * Integration test service District + seed (butuh mongodb-memory-server).
 *
 * Di-SKIP otomatis kalau `mongodb-memory-server` belum ter-install (lihat missingDeps).
 * Begitu dep ada, test ini jalan tanpa ubahan.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose, { Types } from 'mongoose';

import { District } from '../../shared/models/District.js';
import {
  listDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from './district.service.js';
import { addAllDefaultDistricts } from './district.seed.js';

// Probe dep secara dinamis supaya suite tetap hijau saat dep belum ada.
// Pakai tipe loose (dep belum ter-install → tipe-nya pun belum ada).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MongoMemoryServer: any = null;
try {
  ({ MongoMemoryServer } = await import('mongodb-memory-server' as string));
} catch {
  MongoMemoryServer = null;
}

const d = MongoMemoryServer ? describe : describe.skip;

d('district.service (integration)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mem: any;

  beforeAll(async () => {
    mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
  });

  afterEach(async () => {
    await District.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mem.stop();
  });

  it('create + list', async () => {
    await createDistrict({ districtName: 'D.A', districtId: 'AA01' });
    const list = await listDistricts();
    expect(list).toHaveLength(1);
    expect(list[0]?.districtId).toBe('AA01');
  });

  it('create dengan regionName + contractorId (extend field)', async () => {
    const cid = new Types.ObjectId().toString();
    const doc = await createDistrict({
      districtName: 'D.B',
      districtId: 'BB02',
      regionName: 'Palembang',
      contractorId: cid,
    });
    expect(doc.regionName).toBe('Palembang');
    expect(doc.contractorId?.toString()).toBe(cid);
  });

  it('tolak contractorId invalid', async () => {
    await expect(
      createDistrict({ districtName: 'D.C', districtId: 'CC03', contractorId: 'bukan-objectid' }),
    ).rejects.toThrow();
  });

  it('update partial — hanya field terkirim yang berubah', async () => {
    const created = await createDistrict({
      districtName: 'D.D',
      districtId: 'DD04',
      regionName: 'Region1',
    });
    const updated = await updateDistrict(created._id!.toString(), { regionName: 'Region2' });
    expect(updated?.regionName).toBe('Region2');
    expect(updated?.districtId).toBe('DD04');
  });

  it('delete satu vs delete semua', async () => {
    const a = await createDistrict({ districtName: 'D.E', districtId: 'EE05' });
    await createDistrict({ districtName: 'D.F', districtId: 'FF06' });
    expect(await deleteDistrict(a._id!.toString())).toEqual({ deleted: 1 });
    expect((await listDistricts()).length).toBe(1);
    await deleteDistrict(); // semua
    expect((await listDistricts()).length).toBe(0);
  });

  it('addAllDefaultDistricts idempotent (2x = tetap unik per name)', async () => {
    await addAllDefaultDistricts(['D.X|XX01', 'D.Y|YY02']);
    await addAllDefaultDistricts(['D.X|XX01', 'D.Y|YY02']);
    expect((await listDistricts()).length).toBe(2);
  });

  it('addAllDefaultDistricts tidak reset regionName yang sudah di-set admin', async () => {
    await addAllDefaultDistricts(['D.Z|ZZ01']);
    const before = (await listDistricts())[0]!;
    await updateDistrict(before._id!.toString(), { regionName: 'Palembang' });
    await addAllDefaultDistricts(['D.Z|ZZ01']); // seed ulang
    const after = (await listDistricts())[0]!;
    expect(after.regionName).toBe('Palembang');
  });
});
