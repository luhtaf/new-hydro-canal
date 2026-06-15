import { describe, it, expect } from 'vitest';
import { buildFileName, revInTxt } from './fileName.js';
import type { FileNameParams } from '../types.js';

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

  it('revision > 0 muncul di segmen rev', () => {
    const p: FileNameParams = {
      districtCode: '3C01',
      qcDate: new Date('2026-05-18T00:00:00'),
      usv: 'KBN01',
      urut: 1,
      revision: 2,
      requestType: 'QC',
    };
    expect(buildFileName(p)).toBe('3C01-260518-KBN01-1R2Q1');
  });

  it('YYMMDD pad bulan/tanggal satu digit', () => {
    const p: FileNameParams = {
      districtCode: 'AB12',
      qcDate: new Date('2026-03-07T00:00:00'),
      usv: 'KBN05',
      urut: 1,
      requestType: 'QC',
    };
    expect(buildFileName(p)).toBe('AB12-260307-KBN05-1R0Q1');
  });
});

describe('revInTxt', () => {
  it('QC: REV = revision', () => {
    expect(revInTxt(1, 'QC')).toBe(1);
  });

  it('RE-QC: REV = revision + 1 (DOMAIN.md poin 7)', () => {
    expect(revInTxt(1, 'RE-QC')).toBe(2);
  });

  it('revision 0 + QC → 0', () => {
    expect(revInTxt(0, 'QC')).toBe(0);
  });
});
