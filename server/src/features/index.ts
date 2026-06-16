/**
 * Barel route fitur. Tiap slice MENAMBAH router-nya sendiri di sini:
 *
 *   import { authRouter } from './auth/auth.routes.js';
 *   export function mountFeatures(app: Express) {
 *     app.use('/auth', authRouter);
 *     ...
 *   }
 *
 * Sengaja kosong di scaffold — slice nambah sendiri. app.ts memanggil mountFeatures().
 */
import type { Express } from 'express';
import { authRouter } from './auth/auth.routes.js';
import { syncRouter } from './sync/sync.routes.js';
import { districtRouter } from './district/district.routes.js';
import { pengukuranRouter } from './pengukuran/pengukuran.routes.js';
import { dataRouter } from './data/data.routes.js';
// Phase 2 ops layer.
import { undanganRouter } from './undangan/undangan.routes.js';
import { penugasanRouter } from './penugasan/penugasan.routes.js';
import { qcRouter } from './qc/qc.routes.js';
import { reportsRouter } from './reports/reports.routes.js';
import { auditRouter } from './audit/audit.routes.js';
import { userRouter } from './user/user.routes.js';
import { notificationRouter } from './notification/notification.routes.js';

export function mountFeatures(app: Express): void {
  app.use('/auth', authRouter);
  // Slice sync (local-first PouchDB ⇄ Mongo). Spec § D.
  app.use('/sync', syncRouter);
  // Slice district (CRUD master distrik + region/contractor).
  app.use('/districts', districtRouter);
  // Slice pengukuran (threshold singleton, admin-only mutate).
  app.use('/pengukuran', pengukuranRouter);
  // Slice data: PORT endpoint existing (polymorphic :id). Path ABSOLUT (/datas,
  // /version, /data/:id, dst) → mount di root supaya kompat dgn app lama & FE port.
  app.use('/', dataRouter);

  // --- Phase 2 ops layer ---
  // Undangan & penugasan: path ABSOLUT lintas-resource (/aoi/import, /aois,
  // /canals/assign, /penugasan/mine, dst) → mount di root.
  app.use('/', undanganRouter);
  app.use('/', penugasanRouter);
  // Prefix mounts.
  app.use('/qc', qcRouter);
  app.use('/reports', reportsRouter);
  app.use('/audit', auditRouter);
  app.use('/users', userRouter);
  app.use('/notifications', notificationRouter);
}
