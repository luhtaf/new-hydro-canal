/**
 * Controller sync — validasi (zod) + ambil userId dari session + delegasi ke service.
 * Tipis: tak ada logika domain di sini (ada di service/projection/conflict).
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { pushDocs, pullChanges, seedForUser } from './sync.service.js';

/** Skema 1 SyncDoc yang masuk via push. Payload bebas (divalidasi per-tipe di projection). */
const syncDocSchema = z.object({
  _id: z.string().min(1),
  _rev: z.string().optional(),
  type: z.enum(['parameter', 'depth', 'canal', 'meta']),
  payload: z.record(z.unknown()),
  serverBase: z.string().nullable().optional(),
  updatedAt: z.string().min(1),
  _deleted: z.boolean().optional(),
});

const pushSchema = z.object({
  docs: z.array(syncDocSchema).min(1).max(500),
});

const pullSchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

/** Ambil userId dari session; throw 401 kalau tak ada. */
function requireUserId(req: { session?: { userId?: string } }): string {
  const uid = req.session?.userId;
  if (!uid) {
    const err = new Error('Sesi tidak valid') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return uid;
}

/** POST /sync/push */
export const postPush: RequestHandler = async (req, res, next) => {
  try {
    requireUserId(req as never);
    const { docs } = pushSchema.parse(req.body);
    const results = await pushDocs(docs);
    res.json({ results });
  } catch (err) {
    next(err);
  }
};

/** GET /sync/pull?since=&limit= */
export const getPull: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req as never);
    const { since, limit } = pullSchema.parse(req.query);
    const out = await pullChanges(userId, since, limit);
    res.json(out);
  } catch (err) {
    next(err);
  }
};

/** POST /sync/seed */
export const postSeed: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req as never);
    const seed = await seedForUser(userId);
    res.json(seed);
  } catch (err) {
    next(err);
  }
};
