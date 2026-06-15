/**
 * Route District (PORT + extend). GET auth · POST/PUT/DELETE admin (PLAN-BE.md).
 * Polymorphic DELETE: tanpa :id = hapus semua (port pola lama).
 *
 * Mount: '/districts' via features/index.ts. Guard auth/role dari shared/middleware
 * (diisi slice auth — saat ini stub yang throw; route tetap ter-mount untuk integrasi).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import {
  getDistricts,
  postDistrict,
  putDistrict,
  removeDistrict,
} from './district.controller.js';

// Express 4 tak meneruskan rejection async ke errorHandler — wrap manual.
const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const districtRouter: Router = Router();

districtRouter.get('/', requireAuth, wrap(getDistricts));
districtRouter.post('/', requireAuth, requireRole('admin'), wrap(postDistrict));
districtRouter.put('/:id', requireAuth, requireRole('admin'), wrap(putDistrict));
// :id opsional → DELETE /districts (hapus semua) atau /districts/:id (hapus satu).
districtRouter.delete('/:id?', requireAuth, requireRole('admin'), wrap(removeDistrict));
