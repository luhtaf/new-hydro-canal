import { describe, it, expect } from 'vitest';
import {
  segmentDepthParams,
  displayedDepth,
  rawFromDisplayed,
  depthClass,
} from './depthMath';
import type { CanalDataSegment, Threshold } from '../../shared/types';

function seg(p: Partial<CanalDataSegment> = {}): CanalDataSegment {
  return {
    canal_id: 'SB180202',
    dimensi: { panjang: 0, lebar: 0, tinggi: 0 },
    order_no: '2000349189',
    operation_no: '0010',
    start: '0',
    end: '500',
    measure_point: '382956',
    water_level: '0.5',
    depth_correction: '0.2',
    bed_float: '0.1',
    revision: '000',
    qc_type: 'QC',
    operator: '',
    qc_date: '',
    measure_date: '',
    usv_code: 'KBN01',
    district: { name: 'D.SUNGAI_BEYUKU', code: '3C01' },
    canal_upper_width: 0,
    canal_bottom_width: 0,
    canal_length: 500,
    tranducer: 0.3,
    lane: 1,
    content_name: '',
    data: [],
    ...p,
  };
}

const TH: Threshold = { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 };

describe('segmentDepthParams', () => {
  it('parse string field segment ke number', () => {
    expect(segmentDepthParams(seg())).toEqual({
      water_level: 0.5,
      tranducer: 0.3,
      bed_float: 0.1,
      depth_correction: 0.2,
    });
  });

  it('field non-numerik → 0 (parse-aman)', () => {
    const p = segmentDepthParams(seg({ water_level: 'abc' as unknown as string }));
    expect(p.water_level).toBe(0);
  });
});

describe('displayedDepth & rawFromDisplayed', () => {
  it('formula sinkron shared/domain (depth+WL+tranducer+bed-corr)*-1', () => {
    // (2 + 0.5 + 0.3 + 0.1 - 0.2) * -1 = -2.7
    expect(displayedDepth(2, seg())).toBeCloseTo(-2.7, 10);
  });

  it('round-trip displayed → raw = raw semula', () => {
    const s = seg();
    const raw = 2.345;
    expect(rawFromDisplayed(displayedDepth(raw, s), s)).toBeCloseTo(raw, 10);
  });
});

describe('depthClass (bandingkan nilai absolut displayed)', () => {
  it('displayed -2.7 → |2.7| >= lulus 2.5 → pass', () => {
    expect(depthClass(-2.7, TH)).toBe('pass');
  });
  it('displayed -2.2 → toleransi', () => {
    expect(depthClass(-2.2, TH)).toBe('tolerance');
  });
  it('displayed -1.5 → fail', () => {
    expect(depthClass(-1.5, TH)).toBe('fail');
  });
});
