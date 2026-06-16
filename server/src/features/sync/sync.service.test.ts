/**
 * Integration test service sync (butuh mongodb-memory-server).
 * Di-SKIP otomatis kalau dep belum ada (lihat missingDeps).
 *
 * Cakupan: push insert, idempotency, LWW parameter, manual conflict kedalaman,
 * server-wins admin-field, pull?since=, projection flat→Data nested, seed.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

import { Data } from '../../shared/models/Data.js';
import { Canal } from '../../shared/models/Canal.js';
import { pushDocs, pullChanges, seedForUser } from './sync.service.js';
import { SyncDocMeta, SyncCursor } from './models.js';
import { parameterDocId, depthDocId } from './projection.js';
import type { SyncDoc } from '../../shared/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MongoMemoryServer: any = null;
try {
  ({ MongoMemoryServer } = await import('mongodb-memory-server' as string));
} catch {
  MongoMemoryServer = null;
}

const d = MongoMemoryServer ? describe : describe.skip;

const USER = '64b8f0000000000000000001';
const CANAL = 'SB180202';
const AOI = '64b8f0000000000000000099';

function paramDoc(over: Partial<SyncDoc> = {}, payload: Record<string, unknown> = {}): SyncDoc {
  return {
    _id: parameterDocId(CANAL),
    type: 'parameter',
    payload: { canal_id: CANAL, water_level: '1.5', ...payload },
    serverBase: null,
    updatedAt: '2026-06-15T10:00:00.000Z',
    ...over,
  };
}

function depthDoc(sta: number, depth: number, over: Partial<SyncDoc> = {}): SyncDoc {
  return {
    _id: depthDocId(CANAL, sta),
    type: 'depth',
    payload: { canal_id: CANAL, sta, depth },
    serverBase: null,
    updatedAt: '2026-06-15T10:00:00.000Z',
    ...over,
  };
}

d('sync.service (integration)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mem: any;

  beforeAll(async () => {
    mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
  });

  afterEach(async () => {
    await Promise.all([
      Data.deleteMany({}),
      Canal.deleteMany({}),
      SyncDocMeta().deleteMany({}),
      SyncCursor().deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mem) await mem.stop();
  });

  async function seedCanal(extra: Record<string, unknown> = {}) {
    return Canal.create({
      aoiId: new mongoose.Types.ObjectId(AOI),
      district: 'D.SUNGAI_BEYUKU',
      orderNo: '2000349189',
      requestDate: new Date('2026-05-18'),
      requestType: 'QC',
      canalId: CANAL,
      panjang: 500,
      dimensi: '8X5X3',
      measurePoint: '12345',
      startDate: new Date('2026-05-18'),
      finishDate: new Date('2026-05-31'),
      contractor: 'PT CIPTA BUANA SAMUDRA',
      coordX: 400000,
      coordY: 9000000,
      status: 'Assigned',
      assignedTo: new mongoose.Types.ObjectId(USER),
      ...extra,
    });
  }

  it('push parameter baru → buat Data nested + link Canal.dataId', async () => {
    await seedCanal();
    const res = await pushDocs([paramDoc()]);
    expect(res[0]).toMatchObject({ id: parameterDocId(CANAL), ok: true });

    const data = await Data.findOne({ batang_canal_id: CANAL }).lean();
    expect(data).toBeTruthy();
    expect(data!.canal_data[0]?.water_level).toBe('1.5');

    const canal = await Canal.findOne({ canalId: CANAL }).lean();
    expect(canal!.dataId).toBeTruthy();
  });

  it('idempoten: push doc sama 2x = efek sekali', async () => {
    await seedCanal();
    await pushDocs([depthDoc(720, 2.71)]);
    await pushDocs([depthDoc(720, 2.71)]); // ulang persis
    const data = await Data.findOne({ batang_canal_id: CANAL }).lean();
    const points = data!.canal_data[0]?.data ?? [];
    expect(points).toHaveLength(1); // tidak dobel
  });

  it('clamp measure date saat push (DOMAIN.md poin 3)', async () => {
    await seedCanal(); // finishDate 2026-05-31
    await pushDocs([
      paramDoc({}, { measure_date_actual: '2026-06-10T00:00:00.000Z' }),
    ]);
    const data = await Data.findOne({ batang_canal_id: CANAL }).lean();
    expect(data!.canal_data[0]?.measure_date).toBe(
      new Date('2026-05-31T00:00:00.000Z').toISOString(),
    );
  });

  it('LWW parameter: tulis kedua lebih baru menang', async () => {
    await seedCanal();
    await pushDocs([paramDoc({ updatedAt: '2026-06-15T10:00:00.000Z' }, { water_level: '1.0' })]);
    const res = await pushDocs([
      paramDoc(
        { updatedAt: '2026-06-15T11:00:00.000Z', serverBase: '2026-06-15T09:00:00.000Z' },
        { water_level: '2.0' },
      ),
    ]);
    expect(res[0]).toMatchObject({ ok: true });
    const data = await Data.findOne({ batang_canal_id: CANAL }).lean();
    expect(data!.canal_data[0]?.water_level).toBe('2.0');
  });

  it('manual conflict kedalaman: serverBase basi → return conflict, server tak berubah', async () => {
    await seedCanal();
    await pushDocs([depthDoc(720, 2.71, { updatedAt: '2026-06-15T10:00:00.000Z' })]);
    // client edit dengan basis lama (sebelum server stamp 10:00)
    const res = await pushDocs([
      depthDoc(720, 9.99, {
        updatedAt: '2026-06-15T11:00:00.000Z',
        serverBase: '2026-06-15T09:00:00.000Z',
      }),
    ]);
    expect(res[0]).toHaveProperty('conflict');
    const data = await Data.findOne({ batang_canal_id: CANAL }).lean();
    // nilai server TETAP 2.71 (perubahan ditolak, butuh resolve manual)
    expect(data!.canal_data[0]?.data[0]?.depth).toBe(2.71);
  });

  it('pull?since= mengembalikan flat docs untuk canal milik user', async () => {
    await seedCanal();
    await pushDocs([paramDoc(), depthDoc(720, 2.71)]);
    const out = await pullChanges(USER, undefined);
    const ids = out.changes.map((c) => c._id);
    expect(ids).toContain(parameterDocId(CANAL));
    expect(ids).toContain(depthDocId(CANAL, 720));
    expect(out.lastSeq > new Date(0).toISOString()).toBe(true);
  });

  it('pull?since=now tidak mengembalikan perubahan lama', async () => {
    await seedCanal();
    await pushDocs([paramDoc({ updatedAt: '2026-06-15T10:00:00.000Z' })]);
    const out = await pullChanges(USER, '2026-06-15T23:00:00.000Z');
    expect(out.changes).toHaveLength(0);
  });

  it('pull men-scope ke canal milik user (tidak bocor canal user lain)', async () => {
    await seedCanal(); // assigned ke USER
    await pushDocs([paramDoc()]);
    const out = await pullChanges('64b8f0000000000000000002', undefined); // user lain
    expect(out.changes).toHaveLength(0);
  });

  it('seed mengembalikan canals saya + drafts flat', async () => {
    await seedCanal();
    await pushDocs([paramDoc(), depthDoc(720, 2.71)]);
    const seed = await seedForUser(USER);
    expect(seed.canals).toHaveLength(1);
    const draftIds = seed.drafts.map((d2) => d2._id);
    expect(draftIds).toContain(parameterDocId(CANAL));
    expect(draftIds).toContain(depthDocId(CANAL, 720));
  });
});
