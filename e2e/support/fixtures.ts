/**
 * Generator fixture Excel AOI untuk E2E (flow 02 import).
 *
 * Format harus cocok dengan server `aoiParser.ts`:
 *   - Kolom B (index 1), 4 baris pertama = header AOI: Region / Area / Vendor.
 *   - Baris ke-5 (index 4) = header kolom tabel.
 *   - Data mulai baris ke-6.
 *   - Order No = 10 digit numerik, UNIK per canal (DOMAIN CRITICAL).
 *
 * Kita generate .xlsx in-memory dengan SheetJS (`xlsx` sudah jadi dependency repo)
 * supaya tidak perlu commit binary. Order No dirandom per-run agar idempotent
 * (import berulang tidak nabrak index unique `Canal.orderNo`).
 */
import * as XLSX from 'xlsx';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_DIR = join(here, '..', '.artifacts');

export interface GeneratedAoi {
  /** Path absolut .xlsx siap di-setInputFiles. */
  filePath: string;
  /** Order No baris pertama — untuk navigasi ke /undangan/:orderNo. */
  firstOrderNo: string;
  /** Semua order no yang di-generate. */
  orderNos: string[];
  district: string;
  contractor: string;
}

/** 10 digit numerik unik (timestamp-based + index). */
function makeOrderNo(seed: number, idx: number): string {
  const base = (BigInt(seed) % 100000n) * 10000n + BigInt(idx);
  return base.toString().padStart(10, '0').slice(-10);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Bikin file Excel AOI dengan `count` baris canal. District/contractor harus
 * cocok dengan seed master (districts.txt / contractors.json) supaya mapping &
 * filename tidak putus. Default pakai distrik pertama yang umum di seed.
 */
export async function generateAoiFixture(opts: {
  count?: number;
  district?: string;
  contractor?: string;
} = {}): Promise<GeneratedAoi> {
  const count = opts.count ?? 3;
  const district = opts.district ?? 'D.SUNGAI_BEYUKU';
  const contractor = opts.contractor ?? 'PT Wijaya Karya';
  const seed = Date.now();

  const today = new Date();
  const finish = new Date(today.getTime() + 4 * 86_400_000);

  // Baris 1-4: header AOI di kolom B (Aoa = row, kolom B = index 1).
  // SheetJS AOA: tiap baris = array; kolom A kosong, kolom B isi label+value.
  const aoa: (string | number | null)[][] = [
    [null, `Region: SOUTH KALIMANTAN`],
    [null, `Area: BARITO`],
    [null, `Vendor: PT. KARTA BHUMI NUSANTARA`],
    [null, null],
  ];

  // Baris 5: header kolom tabel (urutan bebas; parser baca by name).
  const columns = [
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
  ];
  aoa.push(columns);

  const orderNos: string[] = [];
  for (let i = 0; i < count; i++) {
    const orderNo = makeOrderNo(seed, i + 1);
    orderNos.push(orderNo);
    aoa.push([
      district,
      orderNo,
      iso(today),
      'QC',
      `CANAL-E2E-${i + 1}`,
      1200 + i * 50,
      '3 x 2',
      `MP${i + 1}`,
      iso(today),
      iso(finish),
      contractor,
      300000 + i * 10,
      9700000 + i * 10,
      'Submitted',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AOI QC Canal USV Notification');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  await mkdir(FIXTURE_DIR, { recursive: true });
  const filePath = join(FIXTURE_DIR, `aoi-e2e-${seed}.xlsx`);
  await writeFile(filePath, buf);

  return {
    filePath,
    firstOrderNo: orderNos[0],
    orderNos,
    district,
    contractor,
  };
}

/**
 * Generator CSV titik kedalaman (page 3) untuk flow 05.
 * Format dibaca `excelPage3.parsePage3` (header case-insensitive; minimal sta+depth).
 * Header: sta, depth, lat, lng. Depth negatif (kedalaman di bawah permukaan).
 */
export async function generateDepthCsv(opts: { count?: number } = {}): Promise<{
  filePath: string;
  stas: number[];
}> {
  const count = opts.count ?? 5;
  const seed = Date.now();
  const stas: number[] = [];
  const lines = ['sta,depth,lat,lng'];
  for (let i = 0; i < count; i++) {
    const sta = i * 10;
    stas.push(sta);
    const depth = -(1.5 + i * 0.2); // raw depth (negatif)
    const lat = -3.32 + i * 0.0001;
    const lng = 114.59 + i * 0.0001;
    lines.push(`${sta},${depth.toFixed(3)},${lat.toFixed(5)},${lng.toFixed(5)}`);
  }

  await mkdir(FIXTURE_DIR, { recursive: true });
  const filePath = join(FIXTURE_DIR, `depth-e2e-${seed}.csv`);
  await writeFile(filePath, lines.join('\n'), 'utf8');
  return { filePath, stas };
}
