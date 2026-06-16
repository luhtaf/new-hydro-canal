import { describe, it, expect } from 'vitest';
import { deadlineInfo } from './deadline.js';

// "Hari ini" stabil untuk semua kasus. Request Date sebagai acuan deadline +4 hari.
const REQ = new Date('2026-05-17T00:00:00');

describe('deadlineInfo', () => {
  it('deadline = requestDate + 4 hari', () => {
    const info = deadlineInfo(REQ, REQ);
    expect(info.deadline.getFullYear()).toBe(2026);
    expect(info.deadline.getMonth()).toBe(4); // Mei (0-index)
    expect(info.deadline.getDate()).toBe(21);
  });

  it('hari masuk (requestDate) → sisa 4 hari (emerald)', () => {
    const info = deadlineInfo(REQ, REQ);
    expect(info.daysLeft).toBe(4);
    expect(info.label).toBe('Sisa 4 hari');
    expect(info.tone).toBe('emerald');
  });

  it('selisih > 2 hari → emerald', () => {
    const now = new Date('2026-05-18T00:00:00'); // deadline 21 → 3 hari
    const info = deadlineInfo(REQ, now);
    expect(info.daysLeft).toBe(3);
    expect(info.tone).toBe('emerald');
    expect(info.label).toBe('Sisa 3 hari');
  });

  it('sisa 2 hari → amber', () => {
    const now = new Date('2026-05-19T00:00:00'); // deadline 21 → 2 hari
    const info = deadlineInfo(REQ, now);
    expect(info.daysLeft).toBe(2);
    expect(info.tone).toBe('amber');
    expect(info.label).toBe('Sisa 2 hari');
  });

  it('sisa 1 hari → amber', () => {
    const now = new Date('2026-05-20T00:00:00'); // deadline 21 → 1 hari
    const info = deadlineInfo(REQ, now);
    expect(info.daysLeft).toBe(1);
    expect(info.tone).toBe('amber');
    expect(info.label).toBe('Sisa 1 hari');
  });

  it('deadline hari ini (0) → rose', () => {
    const now = new Date('2026-05-21T00:00:00');
    const info = deadlineInfo(REQ, now);
    expect(info.daysLeft).toBe(0);
    expect(info.tone).toBe('rose');
    expect(info.label).toBe('Deadline hari ini');
  });

  it('sudah lewat → rose dengan label LEWAT N hari', () => {
    const now = new Date('2026-05-23T00:00:00'); // 2 hari setelah deadline
    const info = deadlineInfo(REQ, now);
    expect(info.daysLeft).toBe(-2);
    expect(info.tone).toBe('rose');
    expect(info.label).toBe('LEWAT 2 hari');
  });

  it('abaikan komponen jam saat hitung selisih hari', () => {
    const now = new Date('2026-05-21T23:59:59');
    const info = deadlineInfo(REQ, now);
    expect(info.daysLeft).toBe(0);
    expect(info.tone).toBe('rose');
  });
});
