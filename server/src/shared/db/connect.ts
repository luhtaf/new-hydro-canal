/**
 * Mongoose connect dengan retry sederhana. Cross-cutting (dipakai bootstrap + tests).
 */
import mongoose from 'mongoose';
import { logger } from '../middleware/logger.js';

export async function connectDb(uri: string, retries = 5): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      logger.info('MongoDB tersambung');
      return mongoose;
    } catch (err) {
      logger.error({ err, attempt }, 'Gagal connect MongoDB');
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('unreachable');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
