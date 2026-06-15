/**
 * Controller Penugasan — adapter HTTP tipis (zod validate → service → json).
 * Tidak ada logika domain di sini (semua di service).
 *
 * Assign/unassign mencatat AuditLog (action 'assign') langsung — slice [audit] middleware
 * global belum ada; saat ada, pindahkan ke middleware & hapus penulisan manual ini.
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getAuthUser } from '../../shared/middleware/auth.js';
import { AuditLog } from '../../shared/models/AuditLog.js';
import * as svc from './penugasan.service.js';

const usvEnum = z.enum(['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05']);
const objectId = z.string().regex(/^[0-9a-f]{24}$/, 'ObjectId tidak valid');

const assignSchema = z.object({
  orderNos: z.array(z.string().min(1)).min(1, 'Minimal 1 orderNo'),
  assignedTo: objectId,
  usv: usvEnum,
});

const unassignSchema = z.object({
  orderNos: z.array(z.string().min(1)).min(1, 'Minimal 1 orderNo'),
});

const tabSchema = z
  .enum(['aktif', 'selesai'])
  .catch('aktif'); // default aman kalau query aneh

const canalIdParam = z.object({ canalId: z.string().min(1) });

// ── ASSIGN / UNASSIGN (admin) ──────────────────────────────────────────────────

export const assign: RequestHandler = async (req, res) => {
  const actor = getAuthUser(req);
  const body = assignSchema.parse(req.body);
  const result = await svc.assignCanals(body);

  await AuditLog.create({
    userId: actor.id,
    userName: actor.name,
    userInitials: actor.initials,
    action: 'assign',
    kind: 'Assign penugasan',
    target: `${result.usv} · ${result.updated} kanal`,
    detail: body.orderNos.join(', '),
  });

  res.json(result);
};

export const unassign: RequestHandler = async (req, res) => {
  const actor = getAuthUser(req);
  const body = unassignSchema.parse(req.body);
  const result = await svc.unassignCanals(body.orderNos);

  await AuditLog.create({
    userId: actor.id,
    userName: actor.name,
    userInitials: actor.initials,
    action: 'assign',
    kind: 'Unassign penugasan',
    target: `${result.updated} kanal`,
    detail: body.orderNos.join(', '),
  });

  res.json(result);
};

// ── QUERY "penugasan saya" (auth — scoped ke user dari sesi) ──────────────────

export const mine: RequestHandler = async (req, res) => {
  const actor = getAuthUser(req);
  const tab = tabSchema.parse(req.query.tab);
  res.json(await svc.listMine(actor.id, tab));
};

export const detail: RequestHandler = async (req, res) => {
  const { canalId } = canalIdParam.parse(req.params);
  const found = await svc.getDetail(canalId);
  if (!found) {
    res.status(404).json({ error: 'Penugasan tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  res.json(found);
};
