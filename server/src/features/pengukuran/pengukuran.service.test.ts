/**
 * Integration test service Pengukuran/threshold (butuh mongodb-memory-server).
 * Di-SKIP otomatis kalau dep belum ada (lihat missingDeps).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

import { Pengukuran } from '../../shared/models/Pengukuran.js';
import {
  getThreshold,
  createThreshold,
  updateThreshold,
  deleteThreshold,
} from './pengukuran.service.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MongoMemoryServer: any = null;
try {
  ({ MongoMemoryServer } = await import('mongodb-memory-server' as string));
} catch {
  MongoMemoryServer = null;
}

const d = MongoMemoryServer ? describe : describe.skip;

const SAMPLE = {
  tidakLulus: 2.0,
  toleransi: { batasAwal: 2.0, batasAkhir: 2.5 },
  lulus: 2.5,
};

d('pengukuran.service (integration)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mem: any;

  beforeAll(async () => {
    mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
  });

  afterEach(async () => {
    await Pengukuran.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mem.stop();
  });

  it('getThreshold null saat belum di-set', async () => {
    expect(await getThreshold()).toBeNull();
  });

  it('create lalu get singleton', async () => {
    const res = await createThreshold(SAMPLE);
    expect('doc' in res).toBe(true);
    const got = await getThreshold();
    expect(got?.lulus).toBe(2.5);
    expect(got?.toleransi.batasAkhir).toBe(2.5);
  });

  it('create kedua kali → conflict (singleton)', async () => {
    await createThreshold(SAMPLE);
    const second = await createThreshold(SAMPLE);
    expect(second).toEqual({ conflict: true });
  });

  it('update partial threshold', async () => {
    const created = await createThreshold(SAMPLE);
    if (!('doc' in created)) throw new Error('expected doc');
    const id = (created.doc as { _id: { toString(): string } })._id.toString();
    const updated = await updateThreshold(id, { lulus: 3.0 });
    expect(updated?.lulus).toBe(3.0);
    expect(updated?.tidakLulus).toBe(2.0); // tak berubah
  });

  it('delete threshold', async () => {
    const created = await createThreshold(SAMPLE);
    if (!('doc' in created)) throw new Error('expected doc');
    const id = (created.doc as { _id: { toString(): string } })._id.toString();
    expect(await deleteThreshold(id)).toEqual({ deleted: 1 });
    expect(await getThreshold()).toBeNull();
  });

  it('updateThreshold id invalid → null', async () => {
    expect(await updateThreshold('bukan-id', { lulus: 1 })).toBeNull();
  });
});
