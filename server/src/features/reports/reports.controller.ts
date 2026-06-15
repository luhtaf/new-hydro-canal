/**
 * Controller [reports] — adapter HTTP tipis: validasi query (zod) → service → json.
 * Tidak ada logika domain di sini (semua agregasi di reports.service).
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import * as svc from './reports.service.js';

/** Periode hari valid (7/30/90); default 30. */
const periodQuery = z.object({
  period: z.coerce.number().int().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).catch(30),
});

const trendQuery = periodQuery.extend({
  groupBy: z.enum(['day', 'week']).catch('day'),
});

export const getKpi: RequestHandler = async (req, res) => {
  const { period } = periodQuery.parse(req.query);
  res.json(await svc.getKpi(period));
};

export const getTrend: RequestHandler = async (req, res) => {
  const { period, groupBy } = trendQuery.parse(req.query);
  res.json(await svc.getTrend(period, groupBy));
};

export const getPerRegion: RequestHandler = async (req, res) => {
  const { period } = periodQuery.parse(req.query);
  res.json(await svc.getPerRegion(period));
};

export const getPerOperator: RequestHandler = async (req, res) => {
  const { period } = periodQuery.parse(req.query);
  res.json(await svc.getPerOperator(period));
};

export const getBreakdown: RequestHandler = async (req, res) => {
  const { period } = periodQuery.parse(req.query);
  res.json(await svc.getBreakdown(period));
};
