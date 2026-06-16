/**
 * Express app: cors, helmet, session, route mount + /health.
 * Bootstrap (connect + listen) ada di index.ts — app.ts cuma rakit middleware & route.
 */
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { httpLogger } from './shared/middleware/logger.js';
import { errorHandler, notFound } from './shared/middleware/error.js';
import { mountFeatures } from './features/index.js';
import type { Env } from './shared/config/env.js';

export function createApp(env: Env): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(httpLogger);

  app.use(
    session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: env.MONGO_URI }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 hari (offline tolerance)
      },
    }),
  );

  // Health check — dipakai deploy + canary (PLAN-BE.md "Deployment").
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: process.env.npm_package_version ?? '0.1.0' });
  });

  // Route fitur (slice nambah lewat barel).
  mountFeatures(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
