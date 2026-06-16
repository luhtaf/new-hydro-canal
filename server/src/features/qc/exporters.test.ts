/**
 * Unit test exporter QC murni (tanpa Mongo): TXT, PAT CSV, filename, page2/3 xlsx.
 * QcContext dibuat manual (fixture) supaya test cepat & deterministik.
 */
import { describe, it, expect } from 'vitest';
import type { QcContext } from './qc.context.js';
import { buildQcFileName } from './qc.filename.js';
import { exportTxt } from './exporters/txt.js';
import { exportPatCsv } from './exporters/patCsv.js';
import { exportPage2Xlsx, exportPage3Xlsx } from './exporters/xlsx.js';
import { exportZpm32 } from './exporters/zpm32.js';

function fixture(): QcContext {
  return {
    canal: {
      _id: 'c1',
      aoiId: 'a1',
      district: 'D.SUNGAI_BEYUKU',
      orderNo: '2000349189',
      requestDate: '2026-05-17',
      requestType: 'QC',
      canalId: 'SB180202',
      panjang: 1000,
      dimensi: '8X5X3',
      measurePoint: '382956',
      startDate: '2026-05-01',
      finishDate: '2026-05-31',
      contractor: 'PT CIPTA BUANA SAMUDRA',
      coordX: 540840,
      coordY: 9673402,
      status: 'In Progress',
      assignedTo: 'u1',
      assignedAt: '2026-05-18',
      usv: 'KBN01',
      qcOutput: null,
      dataId: 'd1',
      createdAt: '2026-05-17',
      updatedAt: '2026-05-18',
    },
    segment: {
      canal_id: 'SB180202',
      dimensi: { panjang: 1000, lebar: 5, tinggi: 3 },
      order_no: '2000349189',
      operation_no: '0010',
      start: '0',
      end: '40',
      measure_point: '382956',
      water_level: '2.150',
      depth_correction: '0.020',
      bed_float: '0.080',
      revision: '001',
      qc_type: 'QC',
      operator: 'Fathul A.',
      qc_date: '2026-05-18',
      measure_date: '2026-05-11',
      usv_code: 'KBN01',
      district: { name: 'D.SUNGAI_BEYUKU', code: '3C01' },
      region: 'Palembang',
      canal_upper_width: 8,
      canal_bottom_width: 5,
      canal_length: 1000,
      tranducer: 0.45,
      lane: 1,
      content_name: '',
      data: [],
    },
    operator: null,
    threshold: { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 },
    districtCode: '3C01',
    contractorShort: 'PT. CBS',
    points: [
      { sta: 0, rawDepth: -3.5, displayed: -2.84, klass: 'pass', lat: -2.943, lng: 104.755, coordX: 540840, coordY: 9673402, time: '' },
      { sta: 20, rawDepth: -3.2, displayed: -2.2, klass: 'tolerance', lat: -2.9431, lng: 104.7551, coordX: 540841, coordY: 9673382, time: '' },
      { sta: 40, rawDepth: -3.0, displayed: -1.8, klass: 'fail', lat: -2.9432, lng: 104.7552, coordX: 540842, coordY: 9673362, time: '' },
    ],
    summary: { pass: 1, tol: 1, fail: 1, total: 3 },
  };
}

describe('buildQcFileName', () => {
  it('format [district]-[YYMMDD]-[USV]-[urut][rev][qctype]', () => {
    const fn = buildQcFileName(fixture(), 1);
    expect(fn.base).toBe('3C01-260518-KBN01-1R0Q1');
  });

  it('RE-QC → Q2 + revInTxt naik 1', () => {
    const ctx = fixture();
    ctx.canal.requestType = 'RE-QC';
    const fn = buildQcFileName(ctx, 2);
    expect(fn.base).toBe('3C01-260518-KBN01-2R0Q2');
    expect(fn.revInTxt).toBe(1); // revision 0 + RE-QC
  });
});

describe('exportTxt', () => {
  it('header + tabel STA, status uppercase', () => {
    const { filename, content } = exportTxt(fixture());
    expect(filename).toBe('3C01-260518-KBN01-1R0Q1.txt');
    expect(content).toContain('ORDER NO   : 2000349189');
    expect(content).toContain('KANAL ID   : SB180202');
    expect(content).toContain('PASS');
    expect(content).toContain('FAIL');
    // 3 baris data (STA + spasi + angka koordinat).
    expect(content.split('\n').filter((l) => /^\d+\s+-?\d/.test(l)).length).toBe(3);
  });
});

describe('exportPatCsv', () => {
  it('pakai koordinat UTM apa adanya (tidak convert)', () => {
    const { filename, content } = exportPatCsv(fixture());
    expect(filename).toContain('-pat-utm.csv');
    expect(content).toContain('Easting_UTM,Northing_UTM');
    expect(content).toContain('540840.00,9673402.00');
  });
});

describe('xlsx + zpm32', () => {
  it('menghasilkan buffer non-kosong', () => {
    const p2 = exportPage2Xlsx(fixture());
    const p3 = exportPage3Xlsx(fixture());
    const z = exportZpm32(fixture());
    expect(p2.buffer.length).toBeGreaterThan(0);
    expect(p3.buffer.length).toBeGreaterThan(0);
    expect(z.buffer.length).toBeGreaterThan(0);
    expect(p2.filename).toContain('-page2.xlsx');
    expect(p3.filename).toContain('-page3.xlsx');
    expect(z.filename).toContain('-zpm32.xlsx');
  });
});
