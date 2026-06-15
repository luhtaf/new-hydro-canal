/**
 * Unit test aoiParser — bentuk Excel AOI dibuat in-memory (tanpa Mongo).
 * Verifikasi: header AOI, mapping baris, validasi Order No 10 digit & Measure Point.
 */
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseAoiExcel } from './aoiParser.js';

/** Bangun buffer xlsx menyerupai file WM: 4 baris header AOI + header kolom + data. */
function buildBuffer(dataRows: (string | number)[][]): Buffer {
  const aoa: (string | number)[][] = [
    ['Region', 'Palembang'],
    ['Area', 'SUMSEL P1'],
    ['Vendor', 'PT. KARTA BHUMI NUSANTARA'],
    [],
    [
      'District',
      'Order No.',
      'Request Date',
      'Request Type',
      'Canal ID',
      'Panjang',
      'Dimensi',
      'Measure Point',
      'Start Date',
      'Finish Date',
      'Contractor Name',
      'Coordinate X',
      'Coordinate Y',
      'Status',
    ],
    ...dataRows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AOI');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

const validRow = [
  'D.SUNGAI_BEYUKU',
  '2000349189',
  '2026-05-17',
  'QC',
  'SB180202',
  1000,
  '8X5X3',
  '382956',
  '2026-05-01',
  '2026-05-31',
  'PT CIPTA BUANA SAMUDRA',
  540840,
  9673402,
  'Submitted',
];

describe('parseAoiExcel', () => {
  it('membaca header AOI Region/Area/Vendor', () => {
    const r = parseAoiExcel(buildBuffer([validRow]));
    expect(r.header).toEqual({
      region: 'Palembang',
      area: 'SUMSEL P1',
      vendor: 'PT. KARTA BHUMI NUSANTARA',
    });
  });

  it('memetakan baris valid ke ParsedCanal', () => {
    const r = parseAoiExcel(buildBuffer([validRow]));
    expect(r.errors).toHaveLength(0);
    expect(r.canals).toHaveLength(1);
    const c = r.canals[0]!;
    expect(c.orderNo).toBe('2000349189');
    expect(c.canalId).toBe('SB180202');
    expect(c.panjang).toBe(1000);
    expect(c.measurePoint).toBe('382956');
    expect(c.requestType).toBe('QC');
    expect(c.requestDate.getUTCFullYear()).toBe(2026);
  });

  it('menolak Order No bukan 10 digit', () => {
    const bad = [...validRow];
    bad[1] = '12345'; // 5 digit
    const r = parseAoiExcel(buildBuffer([bad]));
    expect(r.canals).toHaveLength(0);
    expect(r.errors[0]!.reasons.join(' ')).toContain('Order No');
  });

  it('menolak Measure Point dengan spasi', () => {
    const bad = [...validRow];
    bad[7] = '382 956';
    const r = parseAoiExcel(buildBuffer([bad]));
    expect(r.canals).toHaveLength(0);
    expect(r.errors[0]!.reasons.join(' ')).toContain('spasi');
  });

  it('melaporkan kolom wajib kosong', () => {
    const bad = [...validRow];
    bad[0] = ''; // District kosong
    const r = parseAoiExcel(buildBuffer([bad]));
    expect(r.canals).toHaveLength(0);
    expect(r.errors[0]!.reasons.join(' ')).toContain('District');
  });

  it('mendukung RE-QC + status Done', () => {
    const reqc = [...validRow];
    reqc[3] = 'RE-QC';
    reqc[13] = 'Done';
    const r = parseAoiExcel(buildBuffer([reqc]));
    expect(r.canals[0]!.requestType).toBe('RE-QC');
    expect(r.canals[0]!.status).toBe('Done');
  });

  it('melempar error kalau header AOI hilang', () => {
    const ws = XLSX.utils.aoa_to_sheet([['x', 'y']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AOI');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    expect(() => parseAoiExcel(buf)).toThrow(/Header AOI/);
  });
});
