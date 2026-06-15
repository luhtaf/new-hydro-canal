/**
 * Parser Excel "page 3" (kedalaman) — port fitur bulk import existing (DataList.js).
 * 1 sheet = banyak titik STA → DepthPoint[]. Header fleksibel (case-insensitive,
 * sinonim umum). Dipakai DataList (bulk Excel page3).
 *
 * Pakai SheetJS (xlsx) — sudah di package.json scaffold.
 */
import * as XLSX from 'xlsx';
import type { DepthPoint } from '../../shared/types.js';

/** Sinonim header → field DepthPoint. */
const HEADER_MAP: Record<string, keyof DepthPoint> = {
  sta: 'sta',
  station: 'sta',
  sta_distance: 'sta_distance',
  'sta distance': 'sta_distance',
  jarak: 'sta_distance',
  depth: 'depth',
  kedalaman: 'depth',
  lat: 'lattitude',
  lattitude: 'lattitude',
  latitude: 'lattitude',
  lng: 'longitude',
  long: 'longitude',
  longitude: 'longitude',
  time: 'time',
  waktu: 'time',
};

const numField = new Set<keyof DepthPoint>([
  'sta',
  'sta_distance',
  'depth',
  'lattitude',
  'longitude',
]);

/** Hasil parse + ringkasan untuk feedback toast. */
export interface Page3ParseResult {
  points: DepthPoint[];
  rowCount: number;
  skipped: number;
}

/** Parse 1 file Excel/CSV ke daftar DepthPoint. */
export async function parsePage3(file: File): Promise<Page3ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  const rows = sheet
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    : [];

  const points: DepthPoint[] = [];
  let skipped = 0;

  for (const row of rows) {
    const point: Partial<DepthPoint> = {};
    // lacak field yang punya nilai non-kosong (defval:'' bikin sel kosong = '').
    const present = new Set<keyof DepthPoint>();
    for (const [rawKey, rawVal] of Object.entries(row)) {
      const field = HEADER_MAP[rawKey.trim().toLowerCase()];
      if (!field) continue;
      const isEmpty = rawVal === '' || rawVal == null;
      if (!isEmpty) present.add(field);
      if (numField.has(field)) {
        const n = parseFloat(String(rawVal).replace(',', '.'));
        (point[field] as number) = Number.isFinite(n) ? n : 0;
      } else {
        (point[field] as string) = String(rawVal);
      }
    }
    // titik valid minimal punya sta + depth (yang benar-benar terisi).
    if (!present.has('sta') || !present.has('depth')) {
      skipped++;
      continue;
    }
    points.push({
      sta: point.sta ?? 0,
      sta_distance: point.sta_distance ?? 0,
      depth: point.depth ?? 0,
      lattitude: point.lattitude ?? 0,
      longitude: point.longitude ?? 0,
      time: point.time ?? new Date().toISOString(),
    });
  }

  return { points, rowCount: rows.length, skipped };
}
