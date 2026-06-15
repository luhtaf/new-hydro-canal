/**
 * Unit test slice shared-models — TANPA live Mongo (introspeksi schema + parsing seed file).
 *
 * Integration test seed (upsert ke Mongo) menunggu mongodb-memory-server (lihat missingDeps).
 * Di sini kita verifikasi kontrak yang TIDAK butuh DB: registrasi model, nama collection
 * legacy, index wajib (DOMAIN/PLAN-BE), dan format file seed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  Data,
  Pengukuran,
  District,
  Contractor,
  Aoi,
  Canal,
  AuditLog,
  Notification,
} from './index.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('registrasi model', () => {
  it('8 model teregistrasi dengan modelName benar', () => {
    expect(Data.modelName).toBe('Data');
    expect(Pengukuran.modelName).toBe('Pengukuran');
    expect(District.modelName).toBe('District');
    expect(Contractor.modelName).toBe('Contractor');
    expect(Aoi.modelName).toBe('Aoi');
    expect(Canal.modelName).toBe('Canal');
    expect(AuditLog.modelName).toBe('AuditLog');
    expect(Notification.modelName).toBe('Notification');
  });

  it('collection legacy dipertahankan (kompat data lama)', () => {
    expect(Data.collection.name).toBe('datas');
    expect(Pengukuran.collection.name).toBe('pengukurans');
    expect(District.collection.name).toBe('districts');
  });
});

describe('index Canal (PLAN-BE.md)', () => {
  const idx = Canal.schema.indexes();
  const keys = idx.map(([k]) => JSON.stringify(k));

  it('orderNo unique', () => {
    const order = idx.find(([k]) => JSON.stringify(k) === JSON.stringify({ orderNo: 1 }));
    expect(order).toBeDefined();
    expect(order?.[1]?.unique).toBe(true);
  });

  it('punya {assignedTo,status}, {contractor,district}, {status,requestDate}', () => {
    expect(keys).toContain(JSON.stringify({ assignedTo: 1, status: 1 }));
    expect(keys).toContain(JSON.stringify({ contractor: 1, district: 1 }));
    expect(keys).toContain(JSON.stringify({ status: 1, requestDate: -1 }));
  });
});

describe('schema Data (extend backward-compatible)', () => {
  const seg = (Data.schema.path('canal_data') as unknown as { schema: { paths: Record<string, unknown> } }).schema;
  it('field BARU ada di segmen canal_data', () => {
    expect(seg.paths.measure_date).toBeDefined();
    expect(seg.paths.region).toBeDefined();
    expect(seg.paths.coord_x).toBeDefined();
    expect(seg.paths.coord_y).toBeDefined();
  });
  it('ejaan legacy tranducer dipertahankan', () => {
    expect(seg.paths.tranducer).toBeDefined();
  });
});

describe('format seed file', () => {
  it('districts.txt valid: tiap baris NAMA|KODE (kode 4-char)', () => {
    const raw = readFileSync(join(here, 'seeds', 'districts.txt'), 'utf8');
    const rows = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    expect(rows.length).toBeGreaterThan(0);
    for (const line of rows) {
      const [name, code] = line.split('|');
      expect(name).toMatch(/^D\.[A-Z_]+$/); // format D.<NAMA> (DOMAIN.md)
      expect(code?.trim()).toMatch(/^.{4}$/); // kode 4-char untuk filename (DOMAIN.md poin 7)
    }
  });

  it('contractors.json valid: fullName + shortName per item', () => {
    const raw = readFileSync(join(here, 'seeds', 'contractors.json'), 'utf8');
    const list = JSON.parse(raw) as Array<{ fullName: string; shortName: string }>;
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) {
      expect(c.fullName).toBeTruthy();
      expect(c.shortName).toMatch(/^PT\. /); // DOMAIN.md poin 8
    }
  });
});
