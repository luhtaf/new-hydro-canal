/**
 * Unit test seed District (tanpa Mongo — murni parsing + invariant data).
 * Integrasi upsert idempotent dites di integration suite (butuh mongodb-memory-server).
 */
import { describe, it, expect } from 'vitest';
import { parseLine, DEFAULT_DISTRICTS } from './district.seed.js';

describe('parseLine', () => {
  it('parse baris valid name|code', () => {
    expect(parseLine('D.SUNGAI_BEYUKU|3C01')).toEqual({
      districtName: 'D.SUNGAI_BEYUKU',
      districtId: '3C01',
    });
  });

  it('trim spasi di sekitar name & code', () => {
    expect(parseLine('  D.FOO  |  AB12  ')).toEqual({
      districtName: 'D.FOO',
      districtId: 'AB12',
    });
  });

  it('abaikan baris kosong, komentar, dan tanpa pipe', () => {
    expect(parseLine('')).toBeNull();
    expect(parseLine('   ')).toBeNull();
    expect(parseLine('# komentar')).toBeNull();
    expect(parseLine('tanpa-pipe')).toBeNull();
  });

  it('tolak name atau code kosong', () => {
    expect(parseLine('|3C01')).toBeNull();
    expect(parseLine('D.FOO|')).toBeNull();
  });
});

describe('DEFAULT_DISTRICTS invariant', () => {
  it('semua baris parse + kode 4-char (untuk output filename DOMAIN poin 7)', () => {
    for (const line of DEFAULT_DISTRICTS) {
      const parsed = parseLine(line);
      expect(parsed, `baris "${line}" harus parse`).not.toBeNull();
      expect(parsed!.districtId).toHaveLength(4);
    }
  });

  it('districtName unik (idempotent upsert by name)', () => {
    const names = DEFAULT_DISTRICTS.map((l) => parseLine(l)!.districtName);
    expect(new Set(names).size).toBe(names.length);
  });
});
