import { describe, it, expect } from 'vitest';
import {
  parameterSchema,
  softWarnings,
  maxThreeDecimals,
  type ParameterFormValues,
} from './schema';

function base(p: Partial<ParameterFormValues> = {}): ParameterFormValues {
  return {
    canalId: 'SB180202',
    orderNo: '2000349189',
    operationNo: '0010',
    district: 'D.SUNGAI_BEYUKU',
    contractor: 'PT CIPTA BUANA SAMUDRA',
    measurePoint: '382956',
    startSta: 0,
    endSta: 1000,
    panjang: 1000,
    dimensi: '8X5X3',
    coordX: 540840,
    coordY: 9673402,
    waterLevel: '2.150',
    tranducer: '0.450',
    bedFloat: '0.080',
    depthCorrection: '0.020',
    qcType: 'QC',
    revision: '000',
    qcDate: '2026-05-18',
    measureDate: '2026-05-16',
    ...p,
  };
}

describe('maxThreeDecimals', () => {
  it('lolos <= 3 desimal & kosong', () => {
    expect(maxThreeDecimals('2.150')).toBe(true);
    expect(maxThreeDecimals('2')).toBe(true);
    expect(maxThreeDecimals('')).toBe(true);
  });
  it('gagal > 3 desimal', () => {
    expect(maxThreeDecimals('2.1505')).toBe(false);
  });
});

describe('parameterSchema', () => {
  const schema = parameterSchema('SB180202');

  it('terima form valid', () => {
    expect(schema.safeParse(base()).success).toBe(true);
  });

  it('tolak Order No bukan 10 digit', () => {
    const r = schema.safeParse(base({ orderNo: '123' }));
    expect(r.success).toBe(false);
  });

  it('tolak Measure Point dengan spasi', () => {
    const r = schema.safeParse(base({ measurePoint: '38 2956' }));
    expect(r.success).toBe(false);
  });

  it('tolak panjang != Σ STA', () => {
    const r = schema.safeParse(base({ endSta: 800, panjang: 1000 }));
    expect(r.success).toBe(false);
  });

  it('tolak ID kanal tidak match assignment', () => {
    const r = schema.safeParse(base({ canalId: 'SB999999' }));
    expect(r.success).toBe(false);
  });

  it('tolak desimal > 3 angka', () => {
    const r = schema.safeParse(base({ waterLevel: '2.1505' }));
    expect(r.success).toBe(false);
  });
});

describe('softWarnings', () => {
  it('warning saat Operation No bukan 0010', () => {
    expect(softWarnings({ operationNo: '0020' })).toHaveLength(1);
  });
  it('tanpa warning saat 0010', () => {
    expect(softWarnings({ operationNo: '0010' })).toHaveLength(0);
  });
});
