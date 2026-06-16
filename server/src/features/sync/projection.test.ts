/**
 * Unit test projection + conflict — murni (tanpa Mongo). Cepat, deterministik.
 */
import { describe, it, expect } from 'vitest';
import {
  parameterDocId,
  depthDocId,
  parseDocId,
  clampMeasureDate,
  applyParameter,
  applyDepth,
  dataToFlatDocs,
  type ProjectedData,
} from './projection.js';
import { strategyFor, decide } from './conflict.js';

describe('projection — doc id', () => {
  it('rakit & parse parameter id', () => {
    const id = parameterDocId('SB180202');
    expect(id).toBe('parameter:SB180202');
    expect(parseDocId(id)).toEqual({ kind: 'parameter', canalId: 'SB180202' });
  });

  it('rakit & parse depth id', () => {
    const id = depthDocId('SB180202', 720);
    expect(id).toBe('depth:SB180202:720');
    expect(parseDocId(id)).toEqual({ kind: 'depth', canalId: 'SB180202', sta: 720 });
  });

  it('id tak dikenal → null', () => {
    expect(parseDocId('garbage')).toBeNull();
    expect(parseDocId('depth:SB180202:abc')).toBeNull();
  });
});

describe('projection — clamp measure date (DOMAIN.md poin 3)', () => {
  it('clamp ke finishDate kalau lewat', () => {
    const r = clampMeasureDate('2026-06-10T00:00:00.000Z', '2026-05-31T00:00:00.000Z');
    expect(r.clamped).toBe(true);
    expect(r.value).toBe(new Date('2026-05-31T00:00:00.000Z').toISOString());
  });

  it('tidak clamp kalau sebelum finishDate', () => {
    const r = clampMeasureDate('2026-05-20T00:00:00.000Z', '2026-05-31T00:00:00.000Z');
    expect(r.clamped).toBe(false);
    expect(r.value).toBe('2026-05-20T00:00:00.000Z');
  });

  it('tanpa finishDate → pakai apa adanya', () => {
    const r = clampMeasureDate('2026-05-20T00:00:00.000Z', undefined);
    expect(r.clamped).toBe(false);
  });
});

describe('projection — apply parameter & depth', () => {
  it('apply parameter bikin segmen baru lalu merge field', () => {
    const data: ProjectedData = { batang_canal_id: 'SB180202', canal_data: [] };
    applyParameter(data, { canal_id: 'SB180202', water_level: '1.5', tranducer: 0.2 });
    expect(data.canal_data).toHaveLength(1);
    expect(data.canal_data[0]?.water_level).toBe('1.5');
    expect(data.canal_data[0]?.tranducer).toBe(0.2);
  });

  it('apply parameter dengan clamp measure date', () => {
    const data: ProjectedData = { batang_canal_id: 'SB180202', canal_data: [] };
    const r = applyParameter(
      data,
      { canal_id: 'SB180202', measure_date_actual: '2026-06-10T00:00:00.000Z' },
      { finishDate: '2026-05-31T00:00:00.000Z' },
    );
    expect(r.clampedMeasureDate).toBe(true);
    expect(data.canal_data[0]?.measure_date).toBe(new Date('2026-05-31T00:00:00.000Z').toISOString());
  });

  it('apply depth upsert by STA (idempoten, terurut)', () => {
    const data: ProjectedData = { batang_canal_id: 'SB180202', canal_data: [] };
    applyDepth(data, { canal_id: 'SB180202', sta: 720, depth: 2.71 });
    applyDepth(data, { canal_id: 'SB180202', sta: 360, depth: 2.5 });
    applyDepth(data, { canal_id: 'SB180202', sta: 720, depth: 2.84 }); // update, bukan dobel
    const seg = data.canal_data[0]!;
    expect(seg.data).toHaveLength(2);
    expect(seg.data.map((d) => d.sta)).toEqual([360, 720]); // terurut
    expect(seg.data.find((d) => d.sta === 720)?.depth).toBe(2.84); // ter-update
  });

  it('reverse projection: Data → flat docs', () => {
    const data: ProjectedData = { batang_canal_id: 'SB180202', canal_data: [] };
    applyParameter(data, { canal_id: 'SB180202', water_level: '1.5' });
    applyDepth(data, { canal_id: 'SB180202', sta: 720, depth: 2.71 });
    const docs = dataToFlatDocs(data, { updatedAt: '2026-06-15T00:00:00.000Z' });
    const ids = docs.map((d) => d._id);
    expect(ids).toContain('parameter:SB180202');
    expect(ids).toContain('depth:SB180202:720');
  });
});

describe('conflict — strategy mapping (spec § D)', () => {
  it('depth → manual', () => {
    expect(strategyFor({ type: 'depth', payload: {} })).toBe('manual');
  });
  it('parameter → lww', () => {
    expect(strategyFor({ type: 'parameter', payload: {} })).toBe('lww');
  });
  it('canal dengan admin-field → server-wins', () => {
    expect(strategyFor({ type: 'canal', payload: { status: 'Done' } })).toBe('server-wins');
  });
  it('canal tanpa admin-field → lww', () => {
    expect(strategyFor({ type: 'canal', payload: { dimensi: '8X5X3' } })).toBe('lww');
  });
});

describe('conflict — decide', () => {
  const base = '2026-06-15T10:00:00.000Z';
  const newer = '2026-06-15T11:00:00.000Z';

  it('doc baru di server → terima (insert)', () => {
    const d = decide({ type: 'parameter', payload: {}, serverBase: undefined, updatedAt: base }, null);
    expect(d).toMatchObject({ accept: true, conflict: false });
  });

  it('server tak berubah sejak basis → terima', () => {
    const d = decide(
      { type: 'parameter', payload: {}, serverBase: base, updatedAt: newer },
      base, // serverUpdatedAt == basis
    );
    expect(d.accept).toBe(true);
    expect(d.conflict).toBe(false);
  });

  it('lww: server lebih baru tapi client lebih baru lagi → client menang', () => {
    const d = decide(
      { type: 'parameter', payload: {}, serverBase: base, updatedAt: '2026-06-15T12:00:00.000Z' },
      newer,
    );
    expect(d.accept).toBe(true);
  });

  it('lww: server lebih baru & client lebih lama → server menang (tolak, tak konflik UI)', () => {
    const d = decide(
      { type: 'parameter', payload: {}, serverBase: base, updatedAt: base },
      newer,
    );
    expect(d.accept).toBe(false);
    expect(d.conflict).toBe(false);
  });

  it('manual: kedalaman server berubah → selalu conflict UI', () => {
    const d = decide(
      { type: 'depth', payload: {}, serverBase: base, updatedAt: newer },
      newer,
    );
    expect(d.accept).toBe(false);
    expect(d.conflict).toBe(true);
  });

  it('server-wins: admin-field → tolak diam-diam', () => {
    const d = decide(
      { type: 'canal', payload: { status: 'Done' }, serverBase: base, updatedAt: newer },
      newer,
    );
    expect(d.accept).toBe(false);
    expect(d.conflict).toBe(false);
  });
});
