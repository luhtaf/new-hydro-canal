import { describe, it, expect } from 'vitest';
import { toThreshold, toPengukuran, DEFAULT_THRESHOLD } from './api';
import type { Pengukuran, Threshold } from '../../shared/types';

describe('pengaturan/api mapper', () => {
  it('toThreshold meratakan bentuk legacy nested → flat', () => {
    const p: Pengukuran = {
      lulus: 2.6,
      tidakLulus: 2.1,
      toleransi: { batasAwal: 2.1, batasAkhir: 2.6 },
    };
    expect(toThreshold(p)).toEqual<Threshold>({
      lulus: 2.6,
      tidakLulus: 2.1,
      batasAwal: 2.1,
      batasAkhir: 2.6,
    });
  });

  it('toPengukuran membungkus flat → legacy nested toleransi', () => {
    const t: Threshold = { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 };
    expect(toPengukuran(t)).toEqual({
      lulus: 2.5,
      tidakLulus: 2.0,
      toleransi: { batasAwal: 2.0, batasAkhir: 2.5 },
    });
  });

  it('round-trip flat → legacy → flat idempoten', () => {
    const t = DEFAULT_THRESHOLD;
    expect(toThreshold({ _id: 'x', ...toPengukuran(t) })).toEqual(t);
  });
});
