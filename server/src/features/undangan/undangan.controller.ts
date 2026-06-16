/**
 * Controller [undangan] — adapter HTTP tipis (validate → service → json).
 * Logika domain (parse/persist/query) di undangan.service. Auth/role guard di routes.
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getAuthUser } from '../../shared/middleware/auth.js';
import * as svc from './undangan.service.js';

const CANAL_STATUS = ['Submitted', 'Assigned', 'In Progress', 'Done'] as const;

// ── AOI import (POST /aoi/import, multipart xlsx) ──────────────────────────────

export const importAoi: RequestHandler = async (req, res) => {
  const file = (req as unknown as { file?: { buffer: Buffer; originalname: string } }).file;
  if (!file) {
    res.status(400).json({ error: 'File xlsx wajib (field "file")', code: 'NO_FILE' });
    return;
  }
  const actor = getAuthUser(req);
  try {
    const result = await svc.importAoi(file.buffer, file.originalname, {
      id: actor.id,
      name: actor.name,
      initials: actor.initials,
    });
    res.status(201).json(result);
  } catch (err) {
    // Error parse (struktur file rusak) = 422, bukan 500.
    res.status(422).json({
      error: err instanceof Error ? err.message : 'Gagal mem-parse Excel AOI',
      code: 'PARSE_FAILED',
    });
  }
};

// ── AOI list/detail (GET /aois, GET /aois/:id) ─────────────────────────────────

const pageQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listAois: RequestHandler = async (req, res) => {
  const { page, limit } = pageQuery.parse(req.query);
  res.json(await svc.listAois(page, limit));
};

export const getAoi: RequestHandler = async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  const result = await svc.getAoi(id);
  if (!result) {
    res.status(404).json({ error: 'AOI tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  res.json(result);
};

// ── Canal filter/detail (GET /canals, GET /canals/:orderNo) ────────────────────

const canalQuery = z.object({
  status: z.enum(CANAL_STATUS).optional(),
  district: z.string().min(1).optional(),
  contractor: z.string().min(1).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const listCanals: RequestHandler = async (req, res) => {
  const f = canalQuery.parse(req.query);
  res.json(await svc.listCanals(f));
};

export const getCanal: RequestHandler = async (req, res) => {
  const { orderNo } = z.object({ orderNo: z.string().min(1) }).parse(req.params);
  const result = await svc.getCanalByOrderNo(orderNo);
  if (!result) {
    res.status(404).json({ error: 'Canal tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  res.json(result);
};
