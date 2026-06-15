import { describe, it, expect } from 'vitest';
import { splitCanal } from './splitCanal';

describe('splitCanal', () => {
  it('<= 999m tidak di-split', () => {
    expect(splitCanal(999)).toEqual([
      { staStart: 0, staEnd: 999, length: 999, skipFirstSta: false },
    ]);
  });

  it('1200m -> 500 + 700 (contoh DOMAIN.md poin 6)', () => {
    expect(splitCanal(1200)).toEqual([
      { staStart: 0, staEnd: 500, length: 500, skipFirstSta: false },
      { staStart: 500, staEnd: 1200, length: 700, skipFirstSta: true },
    ]);
  });

  it('1107m -> 500 + 607', () => {
    expect(splitCanal(1107)).toEqual([
      { staStart: 0, staEnd: 500, length: 500, skipFirstSta: false },
      { staStart: 500, staEnd: 1107, length: 607, skipFirstSta: true },
    ]);
  });

  it('segmen ke-2 skipFirstSta', () => {
    const segs = splitCanal(1600);
    expect(segs).toHaveLength(2);
    expect(segs.map((s) => s.skipFirstSta)).toEqual([false, true]);
  });

  it('total length = jumlah panjang segmen', () => {
    expect(splitCanal(1009).reduce((a, s) => a + s.length, 0)).toBe(1009);
  });
});
