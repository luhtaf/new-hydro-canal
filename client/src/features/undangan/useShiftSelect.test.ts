import { describe, it, expect } from 'vitest';
import { applyShiftSelect } from './useShiftSelect.js';

const IDS = ['a', 'b', 'c', 'd', 'e'];

describe('applyShiftSelect', () => {
  it('klik biasa toggle satu', () => {
    const r = applyShiftSelect(new Set(), IDS, 1, 'b', false, null);
    expect([...r]).toEqual(['b']);
  });

  it('klik lagi membatalkan', () => {
    const r = applyShiftSelect(new Set(['b']), IDS, 1, 'b', false, 1);
    expect(r.size).toBe(0);
  });

  it('shift+klik memilih rentang dari anchor', () => {
    const r = applyShiftSelect(new Set(['a']), IDS, 3, 'd', true, 0);
    expect([...r].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('shift+klik rentang mundur', () => {
    const r = applyShiftSelect(new Set(), IDS, 0, 'a', true, 2);
    // turnOn ditentukan dari id yang diklik (a belum terpilih → nyalakan)
    expect([...r].sort()).toEqual(['a', 'b', 'c']);
  });
});
