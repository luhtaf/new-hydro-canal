/**
 * Routes Audit — admin-only, read-only (PLAN-BE.md "Audit routes/audit.ts — admin only").
 *
 * Mount: '/audit' via features/index.ts.
 *   GET /audit          → daftar terfilter + paginasi
 *   GET /audit/recent   → N terbaru (activity feed dashboard)
 *
 * Penulisan AuditLog TIDAK di sini — dilakukan shared/middleware/audit yang dipasang
 * di slice-slice mutasi. Slice ini cuma membaca.
 *
 * Express 4 tak meneruskan rejection async ke errorHandler → wrap manual (pola sama
 * dgn slice district).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import { getAudit, getRecent } from './audit.controller.js';

const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const auditRouter: Router = Router();

// /recent didaftarkan SEBELUM '/' generic? Tidak perlu — beda method+path persis,
// tapi tetap urutkan spesifik dulu untuk jaga-jaga konsistensi.
auditRouter.get('/recent', requireAuth, requireRole('admin'), wrap(getRecent));
auditRouter.get('/', requireAuth, requireRole('admin'), wrap(getAudit));
