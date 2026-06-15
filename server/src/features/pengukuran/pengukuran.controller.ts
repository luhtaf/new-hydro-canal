/**
 * Controller Pengukuran (threshold). Validasi zod + delegasi service.
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  getThreshold,
  createThreshold,
  updateThreshold,
  deleteThreshold,
} from './pengukuran.service.js';

const toleransiSchema = z.object({
  batasAwal: z.number(),
  batasAkhir: z.number(),
});

const createSchema = z.object({
  tidakLulus: z.number(),
  toleransi: toleransiSchema,
  lulus: z.number(),
});

const patchSchema = createSchema
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'Body kosong — minimal 1 field' });

export async function getPengukuran(_req: Request, res: Response): Promise<void> {
  const doc = await getThreshold();
  if (!doc) {
    res.status(404).json({ error: 'Threshold belum di-set' });
    return;
  }
  res.json({ data: doc });
}

export async function postPengukuran(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const result = await createThreshold(body);
  if ('conflict' in result) {
    res
      .status(409)
      .json({ error: 'Threshold singleton sudah ada — pakai PATCH untuk ubah' });
    return;
  }
  res.status(201).json({ data: result.doc });
}

export async function patchPengukuran(req: Request, res: Response): Promise<void> {
  const body = patchSchema.parse(req.body);
  const doc = await updateThreshold(req.params.id ?? '', body);
  if (!doc) {
    res.status(404).json({ error: 'Threshold tidak ditemukan' });
    return;
  }
  res.json({ data: doc });
}

export async function deletePengukuran(req: Request, res: Response): Promise<void> {
  const result = await deleteThreshold(req.params.id ?? '');
  res.json(result);
}
