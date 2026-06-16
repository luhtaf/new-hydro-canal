/**
 * Routes [undangan] (PLAN-BE.md "AOI ingestion" + "Canals" GET).
 *
 * Mount via features/index.ts. Path absolut (mount di root '/'):
 *   POST /aoi/import        admin   (multipart xlsx)
 *   GET  /aois              auth
 *   GET  /aois/:id          auth    (AOI + linked canals)
 *   GET  /canals            auth    (filter status/district/contractor/q)
 *   GET  /canals/:orderNo   auth    (canal + siblings kontraktor/distrik sama)
 *
 * Mutasi assign/unassign canal = slice [penugasan] (POST /canals/assign). Slice ini
 * hanya READ canal + OWNER ingestion AOI.
 */
import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import * as c from './undangan.controller.js';

// Express 4 tak meneruskan rejection async ke errorHandler — wrap manual.
const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Upload Excel: di memory (buffer), limit 10 MB, mime whitelist xlsx/xls (PLAN-BE security).
const XLSX_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream', // sebagian browser kirim ini untuk .xlsx
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const okExt = /\.(xlsx|xls)$/i.test(file.originalname);
    if (okExt || XLSX_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file Excel (.xlsx/.xls) yang diterima'));
  },
});

export const undanganRouter: Router = Router();

// AOI ingestion — admin only.
undanganRouter.post(
  '/aoi/import',
  requireAuth,
  requireRole('admin'),
  upload.single('file'),
  wrap(c.importAoi),
);

// AOI list/detail — auth.
undanganRouter.get('/aois', requireAuth, wrap(c.listAois));
undanganRouter.get('/aois/:id', requireAuth, wrap(c.getAoi));

// Canal filter/detail — auth. Rute spesifik tidak ada (orderNo bebas), aman.
undanganRouter.get('/canals', requireAuth, wrap(c.listCanals));
undanganRouter.get('/canals/:orderNo', requireAuth, wrap(c.getCanal));
