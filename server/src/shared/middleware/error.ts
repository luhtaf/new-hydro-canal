/**
 * Global error handler + 404. Cross-cutting; dipakai di app.ts setelah semua route.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validasi gagal', issues: err.issues });
    return;
  }
  logger.error({ err }, 'Unhandled error');
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({ error: err?.message ?? 'Internal server error' });
};
