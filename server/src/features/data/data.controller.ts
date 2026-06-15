/**
 * Controller Data — adapter HTTP tipis di atas data.service.
 * Validasi input (zod) → panggil service → kirim response. Tidak ada logika domain
 * di sini (semua di service). Pola polymorphic `:id` di-handle service.
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { thresholdModel } from './data.models.js';
import type { Threshold } from '../../shared/types.js';
import * as svc from './data.service.js';
import { clearTmpDir } from './export/tmp.js';

const idParam = z.object({ id: z.string().min(1) });

/** Ambil threshold singleton (Pengukurans) untuk proyeksi chart; null kalau belum ada. */
async function loadThreshold(): Promise<Threshold | null> {
  const p = await thresholdModel().findOne().lean<{
    lulus: number;
    tidakLulus: number;
    toleransi: { batasAwal: number; batasAkhir: number };
  }>().exec();
  if (!p) return null;
  return {
    lulus: p.lulus,
    tidakLulus: p.tidakLulus,
    batasAwal: p.toleransi.batasAwal,
    batasAkhir: p.toleransi.batasAkhir,
  };
}

// ── READ ──────────────────────────────────────────────────────────────────────

export const getVersion: RequestHandler = async (_req, res) => {
  res.json({ version: await svc.getVersion() });
};

export const listAll: RequestHandler = async (_req, res) => {
  res.json(await svc.listAll());
};

export const getMainData: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.getMainData(id));
};

export const getSegment: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.getSegment(id));
};

export const getPoint: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.getPoint(id));
};

export const getChartForRoot: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.getChartForRoot(id, await loadThreshold()));
};

export const getChartForSegment: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.getChartForSegment(id, await loadThreshold()));
};

// ── CREATE ──────────────────────────────────────────────────────────────────

export const createMainData: RequestHandler = async (req, res) => {
  // body bebas (port existing) — service yang membatasi field aman.
  res.status(201).json(await svc.createMainData(req.body));
};

export const pushSegment: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.status(201).json(await svc.pushSegment(id, req.body));
};

export const pushPoint: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.status(201).json(await svc.pushPoint(id, req.body));
};

// ── UPDATE ──────────────────────────────────────────────────────────────────

export const updateMainData: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.updateMainData(id, req.body));
};

export const updateSegment: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.updateSegment(id, req.body));
};

export const updatePoint: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.updatePoint(id, req.body));
};

const draggedSchema = z.object({
  points: z
    .array(
      z.object({
        pointId: z.string().min(1).optional(),
        sta: z.number().optional(),
        displayed: z.number(),
      }),
    )
    .min(1),
});

export const updateChartData: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { points } = draggedSchema.parse(req.body);
  res.json(await svc.updateChartData(id, points));
};

// ── EXPORT CHART (route owner = data; render PNG = slice qc) ──────────────────

/**
 * POST /exportallchart/:id — port endpoint existing.
 * Route ini MILIK slice data (polymorphic `:id` keluarga Data), tapi RENDER PNG
 * (chartjs-node-canvas) milik slice [qc]. Sampai qc siap, kembalikan proyeksi
 * chart-ready (final depth + threshold) supaya FE/qc bisa konsumsi tanpa kenal DB.
 * Lihat export/chartProjection.ts untuk handoff ke qc.
 */
export const exportAllChart: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  const segments = await svc.getChartForRoot(id, await loadThreshold());
  res.json({ id, segments });
};

// ── CLEAR TMP (port: DELETE /cleartmp) ────────────────────────────────────────

export const clearTmp: RequestHandler = async (_req, res) => {
  const removed = await clearTmpDir();
  res.json({ ok: true, removed });
};

// ── DELETE ────────────────────────────────────────────────────────────────────

export const deleteAllData: RequestHandler = async (_req, res) => {
  res.json({ ok: true, deleted: await svc.deleteAllData() });
};

export const deleteMainData: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  await svc.deleteMainData(id);
  res.json({ ok: true });
};

export const deleteAllSegments: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.deleteAllSegments(id));
};

export const deleteSegment: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.deleteSegment(id));
};

export const deleteAllPoints: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.deleteAllPoints(id));
};

export const deletePoint: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await svc.deletePoint(id));
};
