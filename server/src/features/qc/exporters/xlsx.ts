/**
 * exporters/xlsx — Excel Page 2 (parameter) & Page 3 (kedalaman) via SheetJS.
 *
 * Page 2 = parameter QC (1 sheet field/value): kanal id, order no, operation no,
 * water_level, tranducer, bed_float, depth_correction, dimensi, qc date, operator.
 * Page 2 export termasuk salah satu fitur "belum terealisasi" app lama (FEEDBACK) →
 * direalisasi di sini.
 *
 * Page 3 = kedalaman (PORT logic existing): No / STA / Latitude / Longitude /
 * Depth(m) / Final depth / Status untuk tiap titik.
 *
 * Validasi parameter (DOMAIN.md poin 9): ID kanal param = canalId; panjang = Σ STA.
 * Dimensi "PxLxT" dipecah jadi 3 kolom.
 */
import * as XLSX from 'xlsx';
import type { QcContext } from '../qc.context.js';
import { buildQcFileName } from '../qc.filename.js';

type Row = (string | number)[];

function paramRows(ctx: QcContext): Row[] {
  const { canal, segment, operator } = ctx;
  return [
    ['Field', 'Value'],
    ['Kanal ID', canal.canalId],
    ['Order No', canal.orderNo],
    ['Operation No', segment.operation_no || '0010'],
    ['Water level', segment.water_level],
    ['Tranducer', String(segment.tranducer)],
    ['Bed float', segment.bed_float],
    ['Depth correction', segment.depth_correction],
    ['Dimensi', canal.dimensi],
    ['Panjang (m)', canal.panjang],
    ['Measure Point', canal.measurePoint],
    ['QC Date', segment.qc_date],
    ['Measure Date', segment.measure_date],
    ['Operator', operator?.name ?? segment.operator ?? ''],
    ['USV', canal.usv ?? segment.usv_code ?? ''],
    ['Kontraktor', ctx.contractorShort],
    ['Region', segment.region ?? ''],
    ['District', `${ctx.districtCode} ${canal.district}`],
  ];
}

function depthRows(ctx: QcContext): Row[] {
  const head: Row = ['No', 'STA', 'Latitude', 'Longitude', 'Depth (m)', 'Final depth', 'Status'];
  const rows: Row[] = ctx.points.map((p, i) => [
    i + 1,
    p.sta,
    Number(p.lat.toFixed(6)),
    Number(p.lng.toFixed(6)),
    Number(p.rawDepth.toFixed(3)),
    Number(p.displayed.toFixed(3)),
    (p.klass ?? 'n/a').toUpperCase(),
  ]);
  return [head, ...rows];
}

/** Export Page 2 (parameter) → xlsx buffer. */
export function exportPage2Xlsx(ctx: QcContext, urut = 1): { filename: string; buffer: Buffer } {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paramRows(ctx)), 'Page 2 - Parameter');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return { filename: `${buildQcFileName(ctx, urut).base}-page2.xlsx`, buffer };
}

/** Export Page 3 (kedalaman) → xlsx buffer. */
export function exportPage3Xlsx(ctx: QcContext, urut = 1): { filename: string; buffer: Buffer } {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(depthRows(ctx)), 'Page 3 - Kedalaman');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return { filename: `${buildQcFileName(ctx, urut).base}-page3.xlsx`, buffer };
}
