import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parsePage3 } from './excelPage3';

/** Bangun File dari array baris (sheet_to_json memakai header baris pertama). */
function makeFile(rows: Record<string, unknown>[]): File {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buf], 'page3.xlsx');
}

describe('parsePage3', () => {
  it('parse header standar (sta/depth/lat/lng)', async () => {
    const file = makeFile([
      { sta: 0, depth: 2.5, lat: -3.1, lng: 104.7, sta_distance: 20 },
      { sta: 20, depth: 2.3, lat: -3.2, lng: 104.8, sta_distance: 20 },
    ]);
    const res = await parsePage3(file);
    expect(res.points).toHaveLength(2);
    expect(res.points[0]!.sta).toBe(0);
    expect(res.points[0]!.depth).toBe(2.5);
    expect(res.points[0]!.lattitude).toBe(-3.1);
    expect(res.points[0]!.longitude).toBe(104.7);
  });

  it('header sinonim Indonesia (kedalaman/jarak)', async () => {
    const file = makeFile([{ sta: 40, kedalaman: 2.1, jarak: 20 }]);
    const res = await parsePage3(file);
    expect(res.points[0]!.depth).toBe(2.1);
    expect(res.points[0]!.sta_distance).toBe(20);
  });

  it('baris tanpa sta/depth dilewati (skipped++)', async () => {
    const file = makeFile([
      { sta: 0, depth: 2.5 },
      { lat: -3.1, lng: 104.7 }, // tanpa sta+depth
    ]);
    const res = await parsePage3(file);
    expect(res.points).toHaveLength(1);
    expect(res.skipped).toBe(1);
  });

  it('koma desimal di-normalisasi ke titik', async () => {
    const file = makeFile([{ sta: 0, depth: '2,75' }]);
    const res = await parsePage3(file);
    expect(res.points[0]!.depth).toBeCloseTo(2.75, 5);
  });
});
