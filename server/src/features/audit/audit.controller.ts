/**
 * Controller Audit — adapter HTTP tipis. Validasi query (zod) → service → json.
 * Read-only; tak ada mutasi (penulisan AuditLog = shared/middleware/audit).
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as svc from './audit.service.js';

const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'userId harus 24 hex');
const action = z.enum([
  'edit',
  'sync',
  'assign',
  'threshold',
  'login',
  'export',
  'import',
]);

const listQuery = z.object({
  userId: objectId.optional(),
  action: action.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const recentQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/** GET /audit?userId&action&from&to&q&page&limit */
export const getAudit: RequestHandler = async (req, res) => {
  const q = listQuery.parse(req.query);
  res.json(await svc.listAudit(q));
};

/** GET /audit/recent?limit=5 */
export const getRecent: RequestHandler = async (req, res) => {
  const { limit } = recentQuery.parse(req.query);
  res.json(await svc.recentAudit(limit ?? 5));
};
