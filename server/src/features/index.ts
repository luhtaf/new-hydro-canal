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
  // Slice Phase 1+ nambah app.use(...) di sini.
}
