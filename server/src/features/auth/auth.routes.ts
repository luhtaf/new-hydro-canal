/**
 * Router auth. Di-mount di features/index.ts → app.use('/auth', authRouter).
 * Tabel endpoint: PLAN-BE.md "Auth (routes/auth.ts)" + /auth/revoke (admin).
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';
import { loginRateLimit } from './loginRateLimit.js';
import { changePin, login, logout, me, revoke } from './auth.controller.js';

export const authRouter: Router = Router();

// Public — di-rate-limit (5 attempt / IP / 15 menit).
authRouter.post('/login', loginRateLimit, login);

// Butuh sesi.
authRouter.get('/me', requireAuth, me);
authRouter.post('/logout', requireAuth, logout);
authRouter.post('/change-pin', requireAuth, changePin);

// Admin only.
authRouter.post('/revoke', requireRole('admin'), revoke);
