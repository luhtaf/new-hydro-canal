/**
 * Router sync. Semua endpoint butuh auth (operator/admin). Guard auth di-own slice
 * `auth` (shared/middleware/auth.ts). Mount lewat features/index.ts → app.use('/sync').
 */
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.js';
import { postPush, getPull, postSeed } from './sync.controller.js';

export const syncRouter: Router = Router();

syncRouter.use(requireAuth);

syncRouter.post('/push', postPush);
syncRouter.get('/pull', getPull);
syncRouter.post('/seed', postSeed);
