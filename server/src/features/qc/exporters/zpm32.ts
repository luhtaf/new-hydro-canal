/**
 * exporters/zpm32 — format ZPM32 (Excel) untuk upload sistem klien.
 *
 * ZPM32 = layout flat 1 sheet berisi metadata kanal + 1 baris per titik kedalaman
 * dengan kolom tetap yang dipakai sistem hilir klien (mengikuti pola template upload
 * existing). Header kolom: MEASURE_POINT, ORDER_NO, OPERATION_NO, CANAL_ID, STA,
 * EASTING, NORTHING, DEPTH, WL, TRANDUCER, BED_FLOAT, DEPTH_CORR, FINAL_DEPTH,
 * QC_DATE, MEASURE_DATE, USV, STATUS.
 *
 * Final depth via shared/domain (poin 4). Koordinat UTM (poin "Koordinat").
 */
import * as XLSX from 'xlsx';
import type { QcContext } from '../qc.context.js';
import { buildQcFileName } from '../qc.filename.js';

const COLUMNS = [
  'MEASURE_POINT',
  'ORDER_NO',
  'OPERATION_NO',
  'CANAL_ID',
  'STA',
  'EASTING',
  'NORTHING',
  'DEPTH',
  'WL',
  'TRANDUCER',
  'BED_FLOAT',
  'DEPTH_CORR',
  'FINAL_DEPTH',
  'QC_DATE',
  'MEASURE_DATE',
  'USV',
  'STATUS',
] as const;

export function exportZpm32(ctx: QcContext, urut = 1): { filename: string; buffer: Buffer } {
  const { canal, segment } = ctx;
  const usv = canal.usv ?? segment.usv_code ?? '';
  const rows: (string | number)[][] = [COLUMNS.slice()];

  ctx.points.forEach((p) => {
    rows.push([
      canal.measurePoint,
      canal.orderNo,
      segment.operation_no || '0010',
      canal.canalId,
      p.sta,
      Number(p.coordX.toFixed(2)),
      Number(p.coordY.toFixed(2)),
      Number(p.rawDepth.toFixed(3)),
      Number(segment.water_level) || 0,
      Number(segment.tranducer) || 0,
      Number(segment.bed_float) || 0,
      Number(segment.depth_correction) || 0,
      Number(p.displayed.toFixed(3)),
      segment.qc_date,
      segment.measure_date,
      usv,
      (p.klass ?? 'n/a').toUpperCase(),
    ]);
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'ZPM32');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return { filename: `${buildQcFileName(ctx, urut).base}-zpm32.xlsx`, buffer };
}
