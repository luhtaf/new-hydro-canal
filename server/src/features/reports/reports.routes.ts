/**
 * Route [reports] — ADMIN-ONLY (PLAN-BE.md: analytics = admin). Semua endpoint
 * read-only agregasi. Mount: '/reports' via features/index.ts.
 *
 * Guard: requireAuth + requireRole('admin') dari shared/middleware (slice auth).
 * Express 4 tidak meneruskan rejection async → wrap manual (pola district.routes).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import {
  getBreakdown,
  getKpi,
  getPerOperator,
  getPerRegion,
  getTrend,
} from './reports.controller.js';

const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const reportsRouter: Router = Router();

const admin: RequestHandler[] = [requireAuth, requireRole('admin')];

reportsRouter.get('/kpi', ...admin, wrap(getKpi));
reportsRouter.get('/trend', ...admin, wrap(getTrend));
reportsRouter.get('/per-region', ...admin, wrap(getPerRegion));
reportsRouter.get('/per-operator', ...admin, wrap(getPerOperator));
reportsRouter.get('/breakdown', ...admin, wrap(getBreakdown));
