import { describe, it, expect } from 'vitest';
import { classifyThreshold, thresholdColor, THRESHOLD_HEX } from './threshold';
import type { Threshold } from '../types';

const T: Threshold = { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 };

describe('classifyThreshold', () => {
  it('depth >= lulus → pass', () => {
    expect(classifyThreshold(2.5, T)).toBe('pass');
  });
  it('toleransi: tidakLulus <= depth < lulus', () => {
    expect(classifyThreshold(2.0, T)).toBe('tolerance');
    expect(classifyThreshold(2.49, T)).toBe('tolerance');
  });
  it('depth < tidakLulus → fail', () => {
    expect(classifyThreshold(1.99, T)).toBe('fail');
  });
});

describe('thresholdColor', () => {
  it('petakan ke hex yang benar', () => {
    expect(thresholdColor(2.6, T)).toBe(THRESHOLD_HEX.pass);
    expect(thresholdColor(2.2, T)).toBe(THRESHOLD_HEX.tolerance);
    expect(thresholdColor(1.0, T)).toBe(THRESHOLD_HEX.fail);
  });
});
