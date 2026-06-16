/**
 * qc.controller — adapter HTTP tipis di atas qc.service/qc.list.
 * Validasi input (zod) → panggil service → stream file. Tidak ada logika domain di sini.
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getAuthUser } from '../../shared/middleware/auth.js';
import {
  exportSingle,
  exportBulk,
  EXPORT_FORMATS,
  type ExportFormat,
} from './qc.service.js';
import { listQcOutputs } from './qc.list.js';

const canalParam = z.object({ canalId: z.string().min(1) });

const formatEnum = z.enum([
  'png',
  'txt',
  'page2-xlsx',
  'page3-xlsx',
  'pat-csv',
  'zpm32',
]);

/** Set header attachment + kirim Buffer. */
function sendFile(
  res: Parameters<RequestHandler>[1],
  filename: string,
  mime: string,
  body: Buffer,
): void {
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', String(body.length));
  res.end(body);
}

/** Factory handler export single-format (1 endpoint per format share logika). */
function singleExportHandler(format: ExportFormat): RequestHandler {
  return async (req, res) => {
    const { canalId } = canalParam.parse(req.params);
    const result = await exportSingle(canalId, format);
    sendFile(res, result.filename, result.mime, result.body);
  };
}

export const exportPng = singleExportHandler('png');
export const exportTxt = singleExportHandler('txt');
export const exportPage2 = singleExportHandler('page2-xlsx');
export const exportPage3 = singleExportHandler('page3-xlsx');
export const exportPat = singleExportHandler('pat-csv');
export const exportZpm32 = singleExportHandler('zpm32');

const bulkSchema = z.object({
  canalIds: z.array(z.string().min(1)).min(1),
  formats: z.array(formatEnum).min(1).default(['png', 'txt']),
});

/** POST /qc/export/bulk — ZIP banyak canal × banyak format. */
export const exportBulkHandler: RequestHandler = async (req, res) => {
  const { canalIds, formats } = bulkSchema.parse(req.body);
  const { filename, stream } = await exportBulk(canalIds, formats as ExportFormat[]);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  stream.on('error', (err) => {
    if (!res.headersSent) res.status(500);
    res.end();
    void err;
  });
  stream.pipe(res);
};

/** GET /qc/outputs — daftar kartu output untuk grid FE. */
export const listOutputs: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  res.json(await listQcOutputs({ role: user.role, userId: user.id }));
};

/** GET /qc/formats — metadata format yang didukung (untuk FE render tombol). */
export const listFormats: RequestHandler = (_req, res) => {
  res.json({ formats: EXPORT_FORMATS });
};
