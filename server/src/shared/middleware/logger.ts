/**
 * Pino logger tunggal + pino-http middleware. Ganti console.log existing.
 */
import pino from 'pino';
import { pinoHttp } from 'pino-http';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
});

export const httpLogger = pinoHttp({ logger });
