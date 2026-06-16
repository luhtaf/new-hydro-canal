/**
 * Unit test auth slice — bagian yang bebas Mongo (validasi PIN, hash bcrypt
 * roundtrip, rate limiter). Integration (login/revoke vs mongo-memory-server)
 * menyusul di tests/integration sesuai spec § E.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { hashPin, isValidPin } from './auth.service.js';
import { clearLoginAttempts, loginRateLimit } from './loginRateLimit.js';

describe('isValidPin', () => {
  it('terima 4-6 digit', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
  });
  it('tolak non-digit / panjang salah', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12ab')).toBe(false);
    expect(isValidPin(1234 as unknown)).toBe(false);
    expect(isValidPin(undefined)).toBe(false);
  });
});

describe('hashPin (bcrypt cost 12)', () => {
  it('hash beda dari plaintext & verifiable', async () => {
    const bcrypt = (await import('bcrypt')).default;
    const hash = await hashPin('1234');
    expect(hash).not.toBe('1234');
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
    expect(await bcrypt.compare('1234', hash)).toBe(true);
    expect(await bcrypt.compare('9999', hash)).toBe(false);
  });
});

describe('loginRateLimit', () => {
  function mockReqRes(ip: string, identifier: string) {
    const req = { ip, body: { email: identifier } } as unknown as Request;
    let statusCode = 200;
    const headers: Record<string, string> = {};
    const res = {
      status(c: number) {
        statusCode = c;
        return this;
      },
      json() {
        return this;
      },
      setHeader(k: string, v: string) {
        headers[k] = v;
      },
      get statusCode() {
        return statusCode;
      },
      get headers() {
        return headers;
      },
    } as unknown as Response & { statusCode: number; headers: Record<string, string> };
    return { req, res };
  }

  beforeEach(() => {
    clearLoginAttempts('1.1.1.1', 'a@b.com');
  });

  it('izinkan 5 attempt lalu blokir ke-6', () => {
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };
    for (let i = 0; i < 5; i++) {
      const { req, res } = mockReqRes('1.1.1.1', 'a@b.com');
      loginRateLimit(req, res, next);
    }
    expect(nextCalls).toBe(5);

    const { req, res } = mockReqRes('1.1.1.1', 'a@b.com');
    loginRateLimit(req, res, next);
    expect(nextCalls).toBe(5); // tidak naik
    expect((res as unknown as { statusCode: number }).statusCode).toBe(429);
    expect((res as unknown as { headers: Record<string, string> }).headers['Retry-After']).toBeDefined();
  });

  it('clearLoginAttempts reset window', () => {
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };
    for (let i = 0; i < 5; i++) {
      const { req, res } = mockReqRes('2.2.2.2', 'c@d.com');
      loginRateLimit(req, res, next);
    }
    clearLoginAttempts('2.2.2.2', 'c@d.com');
    const { req, res } = mockReqRes('2.2.2.2', 'c@d.com');
    loginRateLimit(req, res, next);
    expect(nextCalls).toBe(6); // lolos lagi setelah reset
    expect((res as unknown as { statusCode: number }).statusCode).toBe(200);
  });

  it('window terpisah per IP+identifier', () => {
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };
    for (let i = 0; i < 5; i++) {
      const { req, res } = mockReqRes('3.3.3.3', 'x@y.com');
      loginRateLimit(req, res, next);
    }
    const { req, res } = mockReqRes('3.3.3.3', 'other@y.com');
    loginRateLimit(req, res, next);
    expect(nextCalls).toBe(6); // identifier beda → bucket beda
    expect((res as unknown as { statusCode: number }).statusCode).toBe(200);
  });
});
