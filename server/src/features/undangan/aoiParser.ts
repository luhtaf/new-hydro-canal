/**
 * Parser Excel AOI "AOI QC Canal USV Notification" (PLAN-BE.md "Excel AOI parser").
 *
 * Layout file (dari WM):
 *   - Baris 1-4 (kolom B / index c:1) = header AOI: Region / Area / Vendor.
 *   - Baris ke-5 = header kolom tabel; data mulai baris ke-6 (range:4 di SheetJS).
 *
 * Validasi domain wajib (DOMAIN.md):
 *   - Order No = 10 digit numerik (CRITICAL: unik PER canal).
 *   - Measure Point WAJIB tanpa spasi.
 *   - Kolom REQUIRED tidak boleh kosong.
 *
 * Murni transform Buffer → { header, canals, errors }. Tidak menyentuh DB
 * (persistensi di undangan.service). Bisa diuji tanpa Mongo.
 */
import * as XLSX from 'xlsx';
import type { RequestType, CanalStatus } from '../../shared/types.js';

/** Kolom wajib ada di tiap baris (label persis seperti di Excel WM). */
export const REQUIRED_COLUMNS = [
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
] as const;

/** Header AOI (1 file). */
export interface AoiHeader {
  region: string;
  area: string;
  vendor: string;
}

/** 1 baris AOI hasil parse (siap dipetakan ke Canal). */
export interface ParsedCanal {
  district: string;
  orderNo: string;
  requestDate: Date;
  requestType: RequestType;
  canalId: string;
  panjang: number;
  dimensi: string;
  measurePoint: string;
  startDate: Date;
  finishDate: Date;
  contractor: string;
  coordX: number;
  coordY: number;
  status: CanalStatus;
}

/** 1 error validasi per baris (row = nomor baris Excel, 1-based). */
export interface RowError {
  row: number;
  orderNo?: string;
  reasons: string[];
}

export interface ParseResult {
  header: AoiHeader;
  canals: ParsedCanal[];
  errors: RowError[];
}

/** Ambil nilai cell sebagai string ter-trim (atau '' kalau kosong). */
function cellStr(sheet: XLSX.WorkSheet, r: number, c: number): string {
  const cell = sheet[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
  const v = cell?.v;
  return v == null ? '' : String(v).trim();
}

/** Cari nilai header AOI di kolom B dengan menelusuri 4 baris pertama (toleran offset). */
function findHeaderValue(sheet: XLSX.WorkSheet, keyword: string): string {
  for (let r = 0; r < 6; r++) {
    const label = cellStr(sheet, r, 0).toLowerCase();
    if (label.includes(keyword)) {
      const val = cellStr(sheet, r, 1);
      if (val) return val;
    }
  }
  return '';
}

/** Konversi nilai Excel (Date | number serial | string) ke Date; null kalau gagal. */
function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    // Serial Excel → Date (cellDates:true biasanya sudah convert, ini fallback).
    const parsed = XLSX.SSF?.parse_date_code?.(v);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    return null;
  }
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isNaN(n) ? NaN : n;
}

/**
 * Parse buffer Excel AOI → header + baris canal + daftar error per baris.
 * Lempar Error kalau struktur file fundamental rusak (header AOI tak ada).
 */
export function parseAoiExcel(buffer: Buffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('File Excel kosong / tidak ada sheet.');
  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) throw new Error('Sheet AOI kosong.');

  const region = findHeaderValue(sheet, 'region');
  const area = findHeaderValue(sheet, 'area');
  const vendor = findHeaderValue(sheet, 'vendor');
  if (!region || !area || !vendor) {
    throw new Error(
      'Header AOI (Region/Area/Vendor) tidak ditemukan di 4 baris pertama. Pastikan format "AOI QC Canal USV Notification".',
    );
  }

  // Data tabel: header kolom di baris ke-5 (index 4), data mulai baris ke-6.
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 4, defval: null });

  const errors: RowError[] = [];
  const canals: ParsedCanal[] = [];

  rows.forEach((r, i) => {
    const rowNo = i + 6; // 1-based, +5 header rows, +1 untuk human-friendly
    const reasons: string[] = [];

    for (const col of REQUIRED_COLUMNS) {
      if (r[col] == null || String(r[col]).trim() === '') reasons.push(`kolom "${col}" kosong`);
    }

    const orderNo = String(r['Order No.'] ?? '').trim();
    if (orderNo && !/^\d{10}$/.test(orderNo)) reasons.push('Order No bukan 10 digit numerik');

    const measurePoint = String(r['Measure Point'] ?? '').trim();
    if (measurePoint && /\s/.test(measurePoint)) reasons.push('Measure Point mengandung spasi');

    const requestType = String(r['Request Type'] ?? 'QC').trim().toUpperCase();
    if (requestType && requestType !== 'QC' && requestType !== 'RE-QC') {
      reasons.push(`Request Type "${requestType}" tidak dikenal (QC / RE-QC)`);
    }

    const requestDate = toDate(r['Request Date']);
    const startDate = toDate(r['Start Date']);
    const finishDate = toDate(r['Finish Date']);
    if (r['Request Date'] != null && !requestDate) reasons.push('Request Date tidak valid');
    if (r['Start Date'] != null && !startDate) reasons.push('Start Date tidak valid');
    if (r['Finish Date'] != null && !finishDate) reasons.push('Finish Date tidak valid');

    const panjang = toNumber(r['Panjang']);
    const coordX = toNumber(r['Coordinate X']);
    const coordY = toNumber(r['Coordinate Y']);
    if (r['Panjang'] != null && Number.isNaN(panjang)) reasons.push('Panjang bukan angka');
    if (r['Coordinate X'] != null && Number.isNaN(coordX)) reasons.push('Coordinate X bukan angka');
    if (r['Coordinate Y'] != null && Number.isNaN(coordY)) reasons.push('Coordinate Y bukan angka');

    if (reasons.length > 0) {
      errors.push({ row: rowNo, orderNo: orderNo || undefined, reasons });
      return; // baris invalid tidak ikut di-persist
    }

    const rawStatus = String(r['Status'] ?? 'Submitted').trim();
    const status: CanalStatus =
      rawStatus === 'Assigned' || rawStatus === 'In Progress' || rawStatus === 'Done'
        ? rawStatus
        : 'Submitted';

    canals.push({
      district: String(r['District']).trim(),
      orderNo,
      requestDate: requestDate as Date,
      requestType: (requestType === 'RE-QC' ? 'RE-QC' : 'QC') as RequestType,
      canalId: String(r['Canal ID']).trim(),
      panjang,
      dimensi: String(r['Dimensi']).trim(),
      measurePoint,
      startDate: startDate as Date,
      finishDate: finishDate as Date,
      contractor: String(r['Contractor Name']).trim(),
      coordX,
      coordY,
      status,
    });
  });

  return { header: { region, area, vendor }, canals, errors };
}
