import { describe, it, expect } from 'vitest';
import { deadlineInfo } from './deadline';

const REQ = new Date('2026-05-17T00:00:00');

describe('deadlineInfo', () => {
  it('deadline = requestDate + 4 hari', () => {
    const info = deadlineInfo(REQ, REQ);
    expect(info.deadline.getMonth()).toBe(4);
    expect(info.deadline.getDate()).toBe(21);
  });

  it('hari masuk → sisa 4 hari (emerald)', () => {
    const info = deadlineInfo(REQ, REQ);
    expect(info.daysLeft).toBe(4);
    expect(info.label).toBe('Sisa 4 hari');
    expect(info.tone).toBe('emerald');
  });

  it('sisa > 2 → emerald', () => {
    const info = deadlineInfo(REQ, new Date('2026-05-18T00:00:00'));
    expect(info.daysLeft).toBe(3);
    expect(info.tone).toBe('emerald');
  });

  it('sisa 2 hari → amber', () => {
    const info = deadlineInfo(REQ, new Date('2026-05-19T00:00:00'));
    expect(info.daysLeft).toBe(2);
    expect(info.tone).toBe('amber');
  });

  it('sisa 1 hari → amber', () => {
    const info = deadlineInfo(REQ, new Date('2026-05-20T00:00:00'));
    expect(info.label).toBe('Sisa 1 hari');
    expect(info.tone).toBe('amber');
  });

  it('deadline hari ini → rose', () => {
    const info = deadlineInfo(REQ, new Date('2026-05-21T00:00:00'));
    expect(info.daysLeft).toBe(0);
    expect(info.label).toBe('Deadline hari ini');
    expect(info.tone).toBe('rose');
  });

  it('lewat → rose, label LEWAT N hari', () => {
    const info = deadlineInfo(REQ, new Date('2026-05-23T00:00:00'));
    expect(info.daysLeft).toBe(-2);
    expect(info.label).toBe('LEWAT 2 hari');
    expect(info.tone).toBe('rose');
  });
});
