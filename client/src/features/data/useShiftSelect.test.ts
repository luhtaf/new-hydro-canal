import { describe, it, expect } from 'vitest';
import { applyShiftSelect } from './useShiftSelect';

const ids = ['a', 'b', 'c', 'd', 'e'];

describe('applyShiftSelect', () => {
  it('klik biasa → toggle 1 item', () => {
    const r = applyShiftSelect(new Set(), ids, 1, 'b', false, null);
    expect([...r]).toEqual(['b']);
  });

  it('klik lagi item sama → lepas', () => {
    const r = applyShiftSelect(new Set(['b']), ids, 1, 'b', false, 1);
    expect(r.size).toBe(0);
  });

  it('shift-klik → pilih rentang dari anchor ke index (naik)', () => {
    // anchor di 1 (b sudah terpilih), shift-klik di 4 (e) → b..e
    const r = applyShiftSelect(new Set(['b']), ids, 4, 'e', true, 1);
    expect([...r].sort()).toEqual(['b', 'c', 'd', 'e']);
  });

  it('shift-klik rentang turun (anchor > index)', () => {
    const r = applyShiftSelect(new Set(['d']), ids, 1, 'b', true, 3);
    expect([...r].sort()).toEqual(['b', 'c', 'd']);
  });

  it('shift-klik di item terpilih → lepas rentang', () => {
    const prev = new Set(['a', 'b', 'c']);
    // anchor 0, shift-klik index 2 (c, sudah terpilih) → turnOn=false → lepas a..c
    const r = applyShiftSelect(prev, ids, 2, 'c', true, 0);
    expect(r.size).toBe(0);
  });

  it('tanpa anchor + shift → fallback toggle tunggal', () => {
    const r = applyShiftSelect(new Set(), ids, 2, 'c', true, null);
    expect([...r]).toEqual(['c']);
  });
});
