/**
 * Routes Data — PORT semua endpoint existing (DataRoute.js app lama).
 *
 * Pola POLYMORPHIC `:id` dipertahankan: path-nya yang membedakan level (root/segment/
 * point), bukan id-nya. Satu id bisa nyangkut di 3 level; controller/service resolve.
 *
 * URUTAN route penting: rute spesifik (`/datas`, `/dataschart/:id`, `/alldatas`,
 * `/alldata/:id`, `/alldetaildata/:id`) DIDAFTARKAN SEBELUM rute generic (`/data/:id`,
 * `/detaildata/:id`) supaya Express tidak salah match.
 *
 * Semua mutasi diguard requireAuth (shared). Tidak ada role-gating khusus di sini
 * (port existing: data CRUD terbuka utk operator). Audit middleware menyusul saat
 * slice audit siap (mount global di app, bukan per-route di sini).
 */
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import * as c from './data.controller.js';

export const dataRouter = Router();

// ── Meta ──────────────────────────────────────────────────────────────────────
dataRouter.get('/version', c.getVersion);

// ── List/clear seluruh koleksi (admin-scope; auth cukup, port existing) ────────
dataRouter.get('/alldatas', requireAuth, c.listAll);
dataRouter.delete('/alldatas', requireAuth, c.deleteAllData);

// ── MainData (root Data._id) ───────────────────────────────────────────────────
dataRouter.post('/datas', requireAuth, c.createMainData);
dataRouter.get('/datas/:id', requireAuth, c.getMainData);
dataRouter.patch('/datas/:id', requireAuth, c.updateMainData);
dataRouter.delete('/datas/:id', requireAuth, c.deleteMainData);

// ── Chart (proyeksi final depth + threshold) ───────────────────────────────────
dataRouter.get('/dataschart/:id', requireAuth, c.getChartForRoot); // seluruh root
dataRouter.get('/datachart/:id', requireAuth, c.getChartForSegment); // 1 segmen
dataRouter.patch('/updatechartdata/:id', requireAuth, c.updateChartData); // drag-save
dataRouter.post('/exportallchart/:id', requireAuth, c.exportAllChart); // → handoff qc

// ── Segmen canal_data ──────────────────────────────────────────────────────────
// Spesifik dulu: /alldata/:id (kosongkan semua segmen di root).
dataRouter.delete('/alldata/:id', requireAuth, c.deleteAllSegments);
dataRouter.post('/data/:id', requireAuth, c.pushSegment); // push segmen ke root :id
dataRouter.get('/data/:id', requireAuth, c.getSegment);
dataRouter.patch('/data/:id', requireAuth, c.updateSegment);
dataRouter.delete('/data/:id', requireAuth, c.deleteSegment);

// ── Titik kedalaman (data point) ───────────────────────────────────────────────
// Spesifik dulu: /alldetaildata/:id (kosongkan semua titik di segmen).
dataRouter.delete('/alldetaildata/:id', requireAuth, c.deleteAllPoints);
dataRouter.post('/detaildata/:id', requireAuth, c.pushPoint); // push titik ke segmen :id
dataRouter.get('/detaildata/:id', requireAuth, c.getPoint);
dataRouter.patch('/detaildata/:id', requireAuth, c.updatePoint);
dataRouter.delete('/detaildata/:id', requireAuth, c.deletePoint);

// ── Tmp cleanup (port ClearTemp) ───────────────────────────────────────────────
dataRouter.delete('/cleartmp', requireAuth, c.clearTmp);
