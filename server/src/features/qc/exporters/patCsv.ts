/**
 * exporters/patCsv — Request PAT CSV pakai koordinat UTM (DOMAIN.md "Koordinat").
 *
 * PAT (Permintaan Akuisisi/Titik) keep koordinat UTM (Easting/Northing) APA ADANYA
 * sesuai input — TIDAK convert balik ke lat/lng (DOMAIN.md: "untuk export Request PAT
 * keep koordinat di UTM"). Jika titik kedalaman tak punya UTM eksplisit, dipakai
 * koordinat canal (coordX/coordY) sebagai fallback.
 *
 * Kolom: No,STA,Easting_UTM,Northing_UTM,Depth_m,Status.
 */
import type { QcContext } from '../qc.context.js';
import { buildQcFileName } from '../qc.filename.js';

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportPatCsv(ctx: QcContext, urut = 1): { filename: string; content: string } {
  const head = ['No', 'STA', 'Easting_UTM', 'Northing_UTM', 'Depth_m', 'Status'];
  const lines = [head.map(csvCell).join(',')];
  ctx.points.forEach((p, i) => {
    lines.push(
      [
        i + 1,
        p.sta,
        p.coordX.toFixed(2),
        p.coordY.toFixed(2),
        p.rawDepth.toFixed(3),
        (p.klass ?? 'n/a').toUpperCase(),
      ]
        .map(csvCell)
        .join(','),
    );
  });
  return {
    filename: `${buildQcFileName(ctx, urut).base}-pat-utm.csv`,
    content: lines.join('\n'),
  };
}
