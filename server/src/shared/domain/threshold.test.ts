import { describe, it, expect } from 'vitest';
import { classifyThreshold, thresholdColor, THRESHOLD_HEX } from './threshold.js';
import type { Threshold } from '../types.js';

// Default contoh DOMAIN.md poin 5.
const T: Threshold = { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 };

describe('classifyThreshold', () => {
  it('depth >= lulus → pass', () => {
    expect(classifyThreshold(2.5, T)).toBe('pass');
    expect(classifyThreshold(3.0, T)).toBe('pass');
  });

  it('tidakLulus <= depth < lulus → tolerance', () => {
    expect(classifyThreshold(2.0, T)).toBe('tolerance');
    expect(classifyThreshold(2.49, T)).toBe('tolerance');
  });

  it('depth < tidakLulus → fail', () => {
    expect(classifyThreshold(1.99, T)).toBe('fail');
    expect(classifyThreshold(0, T)).toBe('fail');
  });
});

describe('thresholdColor', () => {
  it('memetakan kelas ke hex yang benar', () => {
    expect(thresholdColor(2.6, T)).toBe(THRESHOLD_HEX.pass);
    expect(thresholdColor(2.2, T)).toBe(THRESHOLD_HEX.tolerance);
    expect(thresholdColor(1.0, T)).toBe(THRESHOLD_HEX.fail);
  });

  it('hex token konsisten (emerald/amber/rose 500)', () => {
    expect(THRESHOLD_HEX).toEqual({
      pass: '#10b981',
      tolerance: '#f59e0b',
      fail: '#f43f5e',
    });
  });
});
