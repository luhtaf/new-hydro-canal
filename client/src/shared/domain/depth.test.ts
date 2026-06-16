import { describe, it, expect } from 'vitest';
import { finalDepth, reverseDepth } from './depth';
import type { DepthParams } from '../types';

describe('finalDepth', () => {
  it('formula (depth + WL + tranducer + bed_float - correction) * -1', () => {
    const p: DepthParams = {
      depth: 2,
      water_level: 0.5,
      tranducer: 0.3,
      bed_float: 0.1,
      depth_correction: 0.2,
    };
    expect(finalDepth(p)).toBeCloseTo(-2.7, 10);
  });

  it('flip ke bawah: depth positif → hasil negatif', () => {
    expect(
      finalDepth({ depth: 3, water_level: 0, tranducer: 0, bed_float: 0, depth_correction: 0 }),
    ).toBe(-3);
  });
});

describe('reverseDepth', () => {
  it('round-trip finalDepth → reverseDepth = depth semula (sinkron FE↔BE)', () => {
    const p: DepthParams = {
      depth: 2.5,
      water_level: 0.4,
      tranducer: 0.2,
      bed_float: 0.15,
      depth_correction: 0.05,
    };
    const displayed = finalDepth(p);
    const { depth, ...rest } = p;
    void depth;
    expect(reverseDepth(displayed, rest)).toBeCloseTo(p.depth, 10);
  });

  it('drag-edit: ubah displayed → raw depth baru benar', () => {
    const rest = { water_level: 0.5, tranducer: 0.3, bed_float: 0.1, depth_correction: 0.2 };
    expect(reverseDepth(-2.84, rest)).toBeCloseTo(2.14, 10);
  });
});
