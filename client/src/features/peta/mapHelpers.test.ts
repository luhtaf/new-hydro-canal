import { describe, it, expect } from 'vitest';
import {
  matchFilter,
  filterCounts,
  sampleSta,
  STATUS_PIN,
} from './mapHelpers.js';
import { PETA_CANALS } from './canals.js';
import { THRESHOLD_HEX } from '../../shared/domain/threshold.js';

describe('matchFilter', () => {
  it('semua → selalu true', () => {
    expect(matchFilter('Submitted', 'semua')).toBe(true);
    expect(matchFilter('Done', 'semua')).toBe(true);
  });
  it('aktif → semua kecuali Done', () => {
    expect(matchFilter('In Progress', 'aktif')).toBe(true);
    expect(matchFilter('Done', 'aktif')).toBe(false);
  });
  it('selesai → hanya Done', () => {
    expect(matchFilter('Done', 'selesai')).toBe(true);
    expect(matchFilter('Assigned', 'selesai')).toBe(false);
  });
});

describe('filterCounts', () => {
  it('aktif + selesai = semua', () => {
    const c = filterCounts(PETA_CANALS);
    expect(c.semua).toBe(PETA_CANALS.length);
    expect(c.aktif + c.selesai).toBe(c.semua);
  });
});

describe('STATUS_PIN', () => {
  it('punya warna untuk tiap status flow', () => {
    (['Submitted', 'Assigned', 'In Progress', 'Done'] as const).forEach((s) => {
      expect(STATUS_PIN[s].color).toMatch(/^#/);
      expect(STATUS_PIN[s].label.length).toBeGreaterThan(0);
    });
  });
});

describe('sampleSta', () => {
  it('deterministik untuk seed yang sama', () => {
    expect(sampleSta('SB180202')).toEqual(sampleSta('SB180202'));
  });
  it('count sesuai argumen + warna valid threshold', () => {
    const s = sampleSta('SB180202', 8);
    expect(s).toHaveLength(8);
    s.forEach((p) => {
      expect(Object.values(THRESHOLD_HEX)).toContain(p.color);
      expect(p.sta).toBeGreaterThanOrEqual(500);
    });
  });
});
