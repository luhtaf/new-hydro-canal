import { describe, it, expect } from 'vitest';
import { relativeTime } from './relativeTime.js';

describe('relativeTime', () => {
  const now = new Date('2026-06-15T12:00:00Z');

  it('di bawah 45 detik → "baru saja"', () => {
    expect(relativeTime('2026-06-15T11:59:30Z', now)).toBe('baru saja');
  });

  it('menit', () => {
    expect(relativeTime('2026-06-15T11:45:00Z', now)).toBe('15 menit lalu');
  });

  it('jam', () => {
    expect(relativeTime('2026-06-15T10:00:00Z', now)).toBe('2 jam lalu');
  });

  it('1 hari → "kemarin"', () => {
    expect(relativeTime('2026-06-14T12:00:00Z', now)).toBe('kemarin');
  });

  it('beberapa hari', () => {
    expect(relativeTime('2026-06-12T12:00:00Z', now)).toBe('3 hari lalu');
  });

  it('minggu', () => {
    expect(relativeTime('2026-06-01T12:00:00Z', now)).toBe('2 minggu lalu');
  });

  it('bulan', () => {
    expect(relativeTime('2026-04-15T12:00:00Z', now)).toBe('2 bulan lalu');
  });

  it('iso tidak valid → string kosong', () => {
    expect(relativeTime('bukan-tanggal', now)).toBe('');
  });
});
