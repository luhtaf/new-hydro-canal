/**
 * Unit test slice audit — bagian MURNI: `buildFilter` (terjemahan query → filter Mongo).
 *
 * Catatan: test integrasi (listAudit/recentAudit lewat Mongo) butuh
 * `mongodb-memory-server` (lihat missingDeps) — di-cover terpisah saat dep tersedia.
 */
import { describe, it, expect } from 'vitest';
import { buildFilter } from './audit.service.js';

describe('buildFilter — query → filter Mongo', () => {
  it('kosong → filter kosong (ambil semua)', () => {
    expect(buildFilter({})).toEqual({});
  });

  it('userId + action diteruskan apa adanya', () => {
    expect(buildFilter({ userId: 'abc', action: 'assign' })).toMatchObject({
      userId: 'abc',
      action: 'assign',
    });
  });

  it('from membentuk ts.$gte', () => {
    const f = buildFilter({ from: '2026-05-01T00:00:00.000Z' });
    const ts = (f.ts as { $gte?: Date });
    expect(ts.$gte).toBeInstanceOf(Date);
    expect(ts.$gte?.toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });

  it('to yang cuma tanggal di-clamp ke akhir hari (23:59:59.999)', () => {
    const f = buildFilter({ to: '2026-05-31' });
    const ts = (f.ts as { $lte?: Date });
    expect(ts.$lte?.getHours()).toBe(23);
    expect(ts.$lte?.getMinutes()).toBe(59);
    expect(ts.$lte?.getMilliseconds()).toBe(999);
  });

  it('from/to invalid diabaikan (tidak bikin ts.$gte/$lte)', () => {
    expect(buildFilter({ from: 'bukan-tanggal' }).ts).toBeUndefined();
  });

  it('q membentuk $or lintas field display + escape regex', () => {
    const f = buildFilter({ q: 'a.b' });
    expect(Array.isArray(f.$or)).toBe(true);
    expect(f.$or).toHaveLength(4);
    const first = (f.$or as Array<{ userName?: RegExp }>)[0]!;
    // titik di-escape supaya literal, bukan wildcard regex.
    expect(first.userName?.source).toBe('a\\.b');
    expect(first.userName?.flags).toContain('i');
  });

  it('q hanya spasi diabaikan', () => {
    expect(buildFilter({ q: '   ' }).$or).toBeUndefined();
  });
});
