/**
 * Controller Notification — adapter HTTP tipis (zod validate → service → json).
 * Tidak ada logika domain di sini. Semua endpoint ter-scope ke user sesi
 * (getAuthUser) — notif itu PER USER, tak ada akses lintas-user.
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getAuthUser } from '../../shared/middleware/auth.js';
import * as svc from './notification.service.js';

const idParam = z.object({ id: z.string().min(1) });

/** GET /notifications/mine — inbox user sesi (items + unread untuk badge). */
export const mine: RequestHandler = async (req, res) => {
  const actor = getAuthUser(req);
  res.json(await svc.listMine(actor.id));
};

/** POST /notifications/:id/read — tandai 1 notif dibaca (guarded by userId). */
export const read: RequestHandler = async (req, res) => {
  const actor = getAuthUser(req);
  const { id } = idParam.parse(req.params);
  const updated = await svc.markRead(actor.id, id);
  if (!updated) {
    res.status(404).json({ error: 'Notifikasi tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  res.json(updated);
};

/** POST /notifications/read-all — tandai semua notif user dibaca. */
export const readAll: RequestHandler = async (req, res) => {
  const actor = getAuthUser(req);
  res.json(await svc.markAllRead(actor.id));
};
