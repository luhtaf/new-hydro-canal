/**
 * Rate-limit login (security checklist PLAN-BE.md: 5 attempt / IP / 15 menit).
 *
 * Implementasi in-memory sliding window — TANPA dependency baru. Cukup untuk 1 box
 * always-on (spec § B). Kalau scale ke multi-instance, ganti ke express-rate-limit
 * + store Redis/Mongo (lihat missingDeps). Window di-reset saat login sukses.
 */
import type { RequestHandler } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Buang bucket kedaluwarsa biar Map tak tumbuh tanpa batas. */
function sweep(now: number): void {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

function keyFor(ip: string, identifier: string): string {
  return `${ip}|${identifier.toLowerCase()}`;
}

export const loginRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  if (buckets.size > 5000) sweep(now);

  const ip = req.ip ?? 'unknown';
  const identifier = String(req.body?.email ?? req.body?.usv ?? '');
  const key = keyFor(ip, identifier);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`,
      code: 'RATE_LIMITED',
    });
    return;
  }

  bucket.count += 1;
  next();
};

/** Reset hitungan untuk identitas (dipanggil saat login sukses). */
export function clearLoginAttempts(ip: string, identifier: string): void {
  buckets.delete(keyFor(ip, identifier));
}
