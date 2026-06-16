import { describe, it, expect } from 'vitest';
import { shortName, CONTRACTOR_SHORT_NAMES } from './shortName';

describe('shortName', () => {
  it('mapping eksplisit DOMAIN.md poin 8', () => {
    expect(shortName('PT CIPTA BUANA SAMUDRA')).toBe('PT. CBS');
    expect(shortName('PT PUTRA RIMBA NUSANTARA')).toBe('PT. PRN');
    expect(shortName('PT MUSI NAULI LESTARI')).toBe('PT. MNL');
    expect(shortName('PT SUMBER HIJAU PERMAI')).toBe('PT. SHP');
  });

  it('fallback: PT. + inisial kata setelah prefix PT', () => {
    expect(shortName('PT BARU SEKALI JAYA')).toBe('PT. BSJ');
  });

  it('mapping konstanta lengkap (4 entri)', () => {
    expect(Object.keys(CONTRACTOR_SHORT_NAMES)).toHaveLength(4);
  });
});
