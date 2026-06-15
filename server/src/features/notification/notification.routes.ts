/**
 * Routes Notification.
 *
 * DI-MOUNT di prefix `/notifications` (lihat features/index.ts — wiring bersama, bukan
 * disentuh slice ini). Semua route auth-only & ter-scope ke user sesi.
 *
 * URUTAN penting: rute spesifik `/read-all` DIDAFTARKAN SEBELUM `/:id/read` supaya
 * Express tidak menafsirkan "read-all" sebagai `:id`.
 *
 * Express 4 tak meneruskan rejection async ke errorHandler — wrap manual (pola penugasan).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import * as c from './notification.controller.js';

const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const notificationRouter: Router = Router();

notificationRouter.get('/mine', requireAuth, wrap(c.mine));
notificationRouter.post('/read-all', requireAuth, wrap(c.readAll));
notificationRouter.post('/:id/read', requireAuth, wrap(c.read));
