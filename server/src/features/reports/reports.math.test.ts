/**
 * Unit test [reports] — bagian MURNI (math, tanpa Mongo). Agregasi pipeline
 * (getKpi/getTrend/dst) butuh `mongodb-memory-server` (lihat missingDeps) →
 * di-cover di test integrasi terpisah saat dep tsb tersedia.
 */
import { describe, it, expect } from 'vitest';
import { pct, round1, windows } from './reports.math.js';

describe('reports.math — pct', () => {
  it('pembagian-nol → 0 (tanpa NaN)', () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(5, 0)).toBe(0);
  });

  it('persentase dibulatkan 1 desimal', () => {
    expect(pct(1, 3)).toBe(33.3);
    expect(pct(142, 163)).toBe(87.1);
    expect(pct(2, 4)).toBe(50);
  });
});

describe('reports.math — round1', () => {
  it('bulatkan ke 1 desimal', () => {
    expect(round1(3.44)).toBe(3.4);
    expect(round1(3.45)).toBe(3.5);
    expect(round1(10)).toBe(10);
  });
});

describe('reports.math — windows', () => {
  const NOW = new Date('2026-06-15T00:00:00.000Z').getTime();

  it('from = now - days (periode sekarang)', () => {
    const { from } = windows(30, NOW);
    expect(from.toISOString()).toBe('2026-05-16T00:00:00.000Z');
  });

  it('prevFrom = now - 2*days (awal periode sebelumnya)', () => {
    const { prevFrom } = windows(30, NOW);
    expect(prevFrom.toISOString()).toBe('2026-04-16T00:00:00.000Z');
  });

  it('periode 7 hari', () => {
    const { from, prevFrom } = windows(7, NOW);
    expect(from.toISOString()).toBe('2026-06-08T00:00:00.000Z');
    expect(prevFrom.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });
});
