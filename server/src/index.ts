/**
 * Bootstrap: load env → connect Mongo → buat app → listen.
 * Seeding (district/contractor/admin) ditambah slice masing-masing via hook di sini nanti.
 */
import 'dotenv/config';
import { loadEnv } from './shared/config/env.js';
import { connectDb } from './shared/db/connect.js';
import { createApp } from './app.js';
import { logger } from './shared/middleware/logger.js';
import { addAllDefaultDistricts } from './features/district/district.seed.js';

async function main(): Promise<void> {
  const env = loadEnv();
  await connectDb(env.MONGO_URI);

  // Seeding saat koneksi open (PORT addAllDefaultDistricts existing). Idempotent.
  await addAllDefaultDistricts();

  const app = createApp(env);
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on :${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} diterima, graceful shutdown...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Bootstrap gagal');
  process.exit(1);
});
