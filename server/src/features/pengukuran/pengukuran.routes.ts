/**
 * Route Pengukuran (threshold singleton). PORT + GATING BARU:
 *   GET    publik-auth (operator boleh baca untuk warna depth)
 *   POST   admin-only  (BARU — app lama tak ada gating)
 *   PATCH  admin-only
 *   DELETE admin-only
 *
 * Mount: '/pengukuran' via features/index.ts. Guard dari shared/middleware (slice auth).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import {
  getPengukuran,
  postPengukuran,
  patchPengukuran,
  deletePengukuran,
} from './pengukuran.controller.js';

// Express 4 tak meneruskan rejection async ke errorHandler — wrap manual.
const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const pengukuranRouter: Router = Router();

pengukuranRouter.get('/', requireAuth, wrap(getPengukuran));
pengukuranRouter.post('/', requireAuth, requireRole('admin'), wrap(postPengukuran));
pengukuranRouter.patch('/:id', requireAuth, requireRole('admin'), wrap(patchPengukuran));
pengukuranRouter.delete('/:id', requireAuth, requireRole('admin'), wrap(deletePengukuran));
