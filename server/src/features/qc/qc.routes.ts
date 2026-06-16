/**
 * Routes QC export (PLAN-BE § "QC export"). Mount di '/qc' (lihat features/index.ts).
 *
 * Semua endpoint requireAuth (scope per-role di-handle service: operator hanya
 * canal-nya, admin semua). Export menulis side-effect (status Done + qcOutput) →
 * audit middleware global menangkapnya saat slice audit aktif.
 *
 * URUTAN: rute spesifik ('/export/bulk', '/outputs', '/formats') sebelum rute
 * ber-param ('/export/:fmt/:canalId') supaya Express tidak salah match.
 */
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import * as c from './qc.controller.js';

export const qcRouter = Router();

// ── Metadata + list (FE grid) ──────────────────────────────────────────────────
qcRouter.get('/formats', requireAuth, c.listFormats);
qcRouter.get('/outputs', requireAuth, c.listOutputs);

// ── Bulk ZIP (spesifik dulu sebelum :canalId) ───────────────────────────────────
qcRouter.post('/export/bulk', requireAuth, c.exportBulkHandler);

// ── Export single-format per canal ──────────────────────────────────────────────
qcRouter.post('/export/png/:canalId', requireAuth, c.exportPng);
qcRouter.post('/export/txt/:canalId', requireAuth, c.exportTxt);
qcRouter.post('/export/page2-xlsx/:canalId', requireAuth, c.exportPage2);
qcRouter.post('/export/page3-xlsx/:canalId', requireAuth, c.exportPage3);
qcRouter.post('/export/pat-csv/:canalId', requireAuth, c.exportPat);
qcRouter.post('/export/zpm32/:canalId', requireAuth, c.exportZpm32);
