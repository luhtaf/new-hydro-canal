/**
 * Controller District — validasi zod + panggil service. Tipis: logika di service.
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  listDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from './district.service.js';

// contractorId: string ObjectId, null, atau kosong (= null).
const contractorIdSchema = z
  .union([z.string().regex(/^[0-9a-f]{24}$/, 'contractorId 24 hex'), z.null()])
  .optional();

const createSchema = z.object({
  districtName: z.string().min(1, 'districtName wajib'),
  districtId: z.string().min(1, 'districtId wajib'),
  regionName: z.union([z.string(), z.null()]).optional(),
  contractorId: contractorIdSchema,
});

// PUT = partial (semua field opsional, minimal 1).
const updateSchema = createSchema.partial().refine(
  (b) => Object.keys(b).length > 0,
  { message: 'Body kosong — minimal 1 field untuk update' },
);

export async function getDistricts(_req: Request, res: Response): Promise<void> {
  const data = await listDistricts();
  res.json({ data });
}

export async function postDistrict(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const doc = await createDistrict(body);
  res.status(201).json({ data: doc });
}

export async function putDistrict(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const doc = await updateDistrict(req.params.id ?? '', body);
  if (!doc) {
    res.status(404).json({ error: 'District tidak ditemukan' });
    return;
  }
  res.json({ data: doc });
}

export async function removeDistrict(req: Request, res: Response): Promise<void> {
  // id opsional: DELETE /districts → hapus semua; DELETE /districts/:id → hapus satu.
  const result = await deleteDistrict(req.params.id);
  res.json(result);
}
