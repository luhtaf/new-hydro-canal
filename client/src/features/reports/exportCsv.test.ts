// @vitest-environment jsdom
/**
 * Unit test exportCsv — susun string CSV + trigger download (butuh DOM untuk
 * anchor → opt-in jsdom). Capture isi via stub Blob constructor (jsdom Blob tak
 * punya .text()). Verifikasi escaping + header + nama file.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportOperatorsCsv } from './exportCsv.js';
import type { OperatorStat } from './api.js';

const sample: OperatorStat[] = [
  { userId: '1', name: 'Budi, S.T.', initials: 'BS', usv: 'KBN01', kanal: 12, passRate: 91.5, reqcRatio: 4.2 },
  { userId: '2', name: 'Sri', initials: 'SR', usv: null, kanal: 8, passRate: 88, reqcRatio: 0 },
];

let capturedCsv = '';
const RealBlob = global.Blob;

beforeEach(() => {
  capturedCsv = '';
  // Stub Blob: rekam string yang dikirim (tanpa BOM) supaya bisa di-assert.
  vi.stubGlobal(
    'Blob',
    class {
      constructor(parts: BlobPart[]) {
        capturedCsv = String(parts[0] ?? '').replace('﻿', '');
      }
    },
  );
  global.URL.createObjectURL = vi.fn(() => 'blob:mock') as unknown as typeof URL.createObjectURL;
  global.URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('Blob', RealBlob);
  vi.restoreAllMocks();
});

describe('exportOperatorsCsv', () => {
  it('header + baris + escaping koma', () => {
    exportOperatorsCsv(sample, 30);
    const lines = capturedCsv.split('\n');
    expect(lines[0]).toBe('Operator,USV,Kanal,Pass rate (%),Re-QC (%)');
    // Nama dgn koma harus di-quote.
    expect(lines[1]).toBe('"Budi, S.T.",KBN01,12,91.5,4.2');
    // USV null → kosong.
    expect(lines[2]).toBe('Sri,,8,88,0');
  });

  it('list kosong → header saja', () => {
    exportOperatorsCsv([], 7);
    expect(capturedCsv).toBe('Operator,USV,Kanal,Pass rate (%),Re-QC (%)');
  });

  it('set nama file dgn period + tanggal', () => {
    let download = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'download', 'set').mockImplementation(function (
      this: HTMLAnchorElement,
      v: string,
    ) {
      download = v;
    });
    exportOperatorsCsv(sample, 90);
    expect(download).toMatch(/^produktivitas-operator-90d-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
