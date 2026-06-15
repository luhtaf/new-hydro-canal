import { describe, it, expect } from 'vitest';
import {
  EMPTY_SEGMENT,
  validateSegment,
  formToSegment,
  segmentToForm,
  type SegmentFormValues,
} from './SegmentForm';
import type { CanalDataSegment } from '../../../shared/types';

const base = (over: Partial<SegmentFormValues> = {}): SegmentFormValues => ({
  ...EMPTY_SEGMENT,
  canal_id: 'SB180202',
  ...over,
});

describe('validateSegment (DOMAIN.md poin 9)', () => {
  it('canal_id wajib', () => {
    expect(validateSegment(base({ canal_id: '' })).canal_id).toBeTruthy();
  });

  it('order_no harus 10 digit numerik', () => {
    expect(validateSegment(base({ order_no: '123' })).order_no).toBeTruthy();
    expect(validateSegment(base({ order_no: '2000349189' })).order_no).toBeUndefined();
  });

  it('measure_point tanpa spasi & numerik', () => {
    expect(validateSegment(base({ measure_point: '38 29' })).measure_point).toBeTruthy();
    expect(validateSegment(base({ measure_point: 'abc' })).measure_point).toBeTruthy();
    expect(validateSegment(base({ measure_point: '382956' })).measure_point).toBeUndefined();
  });

  it('max 3 desimal untuk water_level dkk', () => {
    expect(validateSegment(base({ water_level: '0.1234' })).water_level).toBeTruthy();
    expect(validateSegment(base({ tranducer: '0.300' })).tranducer).toBeUndefined();
  });

  it('form valid lengkap → no error', () => {
    expect(Object.keys(validateSegment(base())).length).toBe(0);
  });
});

describe('formToSegment / segmentToForm round-trip', () => {
  it('konversi balik konsisten untuk field utama', () => {
    const form = base({
      order_no: '2000349189',
      water_level: '0.5',
      tranducer: '0.3',
      canal_length: '500',
      coord_x: '540840',
      coord_y: '9673402',
      district_name: 'D.SUNGAI_BEYUKU',
      district_code: '3C01',
    });
    const seg = formToSegment(form) as CanalDataSegment;
    expect(seg.canal_id).toBe('SB180202');
    expect(seg.tranducer).toBe(0.3);
    expect(seg.canal_length).toBe(500);
    expect(seg.coord_x).toBe(540840);
    expect(seg.district).toEqual({ name: 'D.SUNGAI_BEYUKU', code: '3C01' });

    const back = segmentToForm(seg);
    expect(back.canal_id).toBe('SB180202');
    expect(back.canal_length).toBe('500');
    expect(back.district_code).toBe('3C01');
  });

  it('coord kosong → undefined (tidak dipaksa 0)', () => {
    const seg = formToSegment(base({ coord_x: '', coord_y: '' }));
    expect(seg.coord_x).toBeUndefined();
    expect(seg.coord_y).toBeUndefined();
  });
});
