/**
 * Routes Penugasan.
 *
 * PALING PENTING soal mounting: router ini DI-MOUNT DI ROOT (`app.use('/', penugasanRouter)`)
 * karena path-nya absolut & lintas-resource (`/canals/assign`, `/penugasan/mine`). Lihat
 * features/index.ts (wiring bersama — bukan disentuh slice ini).
 *
 * Resource canal di sini cuma 2 aksi mutasi (assign/unassign); GET /canals list & detail
 * sibling milik slice [canal] (belum ada). Saat slice canal lahir, pindahkan dua route
 * `/canals/*` ke sana — penugasan cukup pegang `/penugasan/*`.
 *
 * Express 4 tak meneruskan rejection async ke errorHandler — wrap manual (pola district).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import * as c from './penugasan.controller.js';

const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const penugasanRouter: Router = Router();

// ── Canal assign/unassign (admin) — admin-field, server-wins via sync ───────────
penugasanRouter.post('/canals/assign', requireAuth, requireRole('admin'), wrap(c.assign));
penugasanRouter.post('/canals/unassign', requireAuth, requireRole('admin'), wrap(c.unassign));

// ── Penugasan saya (auth — scoped ke user sesi) ────────────────────────────────
penugasanRouter.get('/penugasan/mine', requireAuth, wrap(c.mine));
penugasanRouter.get('/penugasan/:canalId', requireAuth, wrap(c.detail));
