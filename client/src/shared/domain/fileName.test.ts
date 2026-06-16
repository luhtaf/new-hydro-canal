import { describe, it, expect } from 'vitest';
import { buildFileName, revInTxt } from './fileName';
import type { FileNameParams } from '../types';

describe('buildFileName', () => {
  it('contoh DOMAIN.md poin 7: 3C01-260518-KBN01-1R0Q1', () => {
    const p: FileNameParams = {
      districtCode: '3C01',
      qcDate: new Date('2026-05-18T00:00:00'),
      usv: 'KBN01',
      urut: 1,
      revision: 0,
      requestType: 'QC',
    };
    expect(buildFileName(p)).toBe('3C01-260518-KBN01-1R0Q1');
  });

  it('RE-QC → qctype Q2', () => {
    const p: FileNameParams = {
      districtCode: '3C01',
      qcDate: new Date('2026-05-18T00:00:00'),
      usv: 'KBN01',
      urut: 2,
      revision: 0,
      requestType: 'RE-QC',
    };
    expect(buildFileName(p)).toBe('3C01-260518-KBN01-2R0Q2');
  });

  it('revision default 0 kalau tidak diisi', () => {
    const p: FileNameParams = {
      districtCode: '3C05',
      qcDate: new Date('2026-01-09T00:00:00'),
      usv: 'KBN02',
      urut: 3,
      requestType: 'QC',
    };
    expect(buildFileName(p)).toBe('3C05-260109-KBN02-3R0Q1');
  });
});

describe('revInTxt', () => {
  it('QC: REV = revision', () => {
    expect(revInTxt(1, 'QC')).toBe(1);
  });
  it('RE-QC: REV = revision + 1', () => {
    expect(revInTxt(1, 'RE-QC')).toBe(2);
  });
});
