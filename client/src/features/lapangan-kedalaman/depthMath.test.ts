import { describe, it, expect } from 'vitest';
import {
  depthDocId,
  displayedOf,
  rawDepthFromFinal,
  statusOf,
  type DepthPayload,
} from './depthMath';
import type { Threshold } from '../../shared/types';

function payload(p: Partial<DepthPayload> = {}): DepthPayload {
  return {
    canalId: 'SB180202',
    sta: 520,
    depth: 2,
    lattitude: -2.943,
    longitude: 104.755,
    measureDate: '2026-05-11',
    water_level: 0.5,
    tranducer: 0.3,
    bed_float: 0.1,
    depth_correction: 0.2,
    ...p,
  };
}

const TH: Threshold = { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 };

describe('depthDocId', () => {
  it('format depth:<canalId>:<sta>', () => {
    expect(depthDocId('SB180202', 520)).toBe('depth:SB180202:520');
  });
});

describe('displayedOf / rawDepthFromFinal (sinkron shared/domain)', () => {
  it('(depth+WL+tranducer+bed-corr)*-1', () => {
    // (2 + 0.5 + 0.3 + 0.1 - 0.2) * -1 = -2.7
    expect(displayedOf(payload())).toBeCloseTo(-2.7, 10);
  });

  it('round-trip displayed → raw', () => {
    const p = payload({ depth: 2.345 });
    const disp = displayedOf(p);
    expect(rawDepthFromFinal(disp, p)).toBeCloseTo(2.345, 10);
  });
});

describe('statusOf (bandingkan |displayed| ke threshold)', () => {
  it('|2.7| >= lulus 2.5 → pass', () => {
    expect(statusOf(payload({ depth: 2 }), TH)).toBe('pass');
  });
  it('|2.2| di toleransi', () => {
    // displayed = -(1.5 + 0.7) = -2.2
    expect(statusOf(payload({ depth: 1.5 }), TH)).toBe('tolerance');
  });
  it('|1.5| < tidakLulus 2.0 → fail', () => {
    // displayed = -(0.8 + 0.7) = -1.5
    expect(statusOf(payload({ depth: 0.8 }), TH)).toBe('fail');
  });
});
