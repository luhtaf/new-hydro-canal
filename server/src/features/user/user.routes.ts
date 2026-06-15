/**
 * Route User — admin-only manajemen akun (PLAN-BE "User management").
 * Mount: '/users' via features/index.ts. Semua butuh requireRole('admin').
 *
 * Express 4 tak meneruskan rejection async ke errorHandler — wrap manual
 * (pola sama dgn district.routes).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import {
  deleteUser,
  getUsers,
  patchUser,
  postResetPin,
  postUser,
} from './user.controller.js';

const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const userRouter: Router = Router();

userRouter.get('/', requireAuth, requireRole('admin'), wrap(getUsers));
userRouter.post('/', requireAuth, requireRole('admin'), wrap(postUser));
userRouter.patch('/:id', requireAuth, requireRole('admin'), wrap(patchUser));
// Soft delete (set revoked + naik tokenVersion) — bukan hapus dokumen.
userRouter.delete('/:id', requireAuth, requireRole('admin'), wrap(deleteUser));
userRouter.post('/:id/reset-pin', requireAuth, requireRole('admin'), wrap(postResetPin));
