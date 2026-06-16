/**
 * Typed env. Divalidasi sekali saat boot; throw kalau wajib kosong.
 */
import { z } from 'zod';

const schema = z.object({
  MONGO_URI: z.string().min(1, 'MONGO_URI wajib diisi'),
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET wajib diisi'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Override admin default first-boot (opsional; default di seedDefaultAdmin).
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PIN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  return schema.parse(process.env);
}
