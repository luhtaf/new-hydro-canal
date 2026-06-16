import { describe, it, expect } from 'vitest';
import { splitCanal } from './splitCanal.js';

describe('splitCanal', () => {
  it('<= 999m tidak di-split (1 segmen utuh)', () => {
    expect(splitCanal(998)).toEqual([
      { staStart: 0, staEnd: 998, length: 998, skipFirstSta: false },
    ]);
    expect(splitCanal(999)).toEqual([
      { staStart: 0, staEnd: 999, length: 999, skipFirstSta: false },
    ]);
  });

  it('1200m -> 2 segmen (500 + 700) persis contoh DOMAIN.md poin 6', () => {
    expect(splitCanal(1200)).toEqual([
      { staStart: 0, staEnd: 500, length: 500, skipFirstSta: false },
      { staStart: 500, staEnd: 1200, length: 700, skipFirstSta: true },
    ]);
  });

  it('1107m (SP223200) -> 500 + 607', () => {
    expect(splitCanal(1107)).toEqual([
      { staStart: 0, staEnd: 500, length: 500, skipFirstSta: false },
      { staStart: 500, staEnd: 1107, length: 607, skipFirstSta: true },
    ]);
  });

  it('1009m (SPFB1400) -> 500 + 509', () => {
    expect(splitCanal(1009)).toEqual([
      { staStart: 0, staEnd: 500, length: 500, skipFirstSta: false },
      { staStart: 500, staEnd: 1009, length: 509, skipFirstSta: true },
    ]);
  });

  it('segmen ke-2 selalu skipFirstSta (hindari duplikat TXT)', () => {
    const segs = splitCanal(1600);
    expect(segs).toHaveLength(2);
    expect(segs.map((s) => s.skipFirstSta)).toEqual([false, true]);
  });

  it('total length = jumlah panjang segmen', () => {
    expect(splitCanal(1107).reduce((a, s) => a + s.length, 0)).toBe(1107);
  });

  it('segmentSize custom dihormati', () => {
    expect(splitCanal(1600, 1000)).toEqual([
      { staStart: 0, staEnd: 1000, length: 1000, skipFirstSta: false },
      { staStart: 1000, staEnd: 1600, length: 600, skipFirstSta: true },
    ]);
  });

  it('segmentSize <= 0 fallback ke 1 segmen utuh', () => {
    expect(splitCanal(1200, 0)).toEqual([
      { staStart: 0, staEnd: 1200, length: 1200, skipFirstSta: false },
    ]);
  });

  it('segmentSize >= totalLength fallback ke 1 segmen utuh', () => {
    expect(splitCanal(1200, 1200)).toEqual([
      { staStart: 0, staEnd: 1200, length: 1200, skipFirstSta: false },
    ]);
  });
});
