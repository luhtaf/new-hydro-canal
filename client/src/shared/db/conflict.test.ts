import { describe, it, expect, beforeEach } from 'vitest';
import {
  defaultStrategy,
  toConflictItem,
  extractConflicts,
  resolveSingle,
  resolveMulti,
  autoResolve,
  diffFields,
  add,
  addMany,
  remove,
  list,
  count,
  subscribe,
} from './conflict';
import type { SyncDoc, PushResult, ConflictItem } from '../types';

function doc(id: string, type: SyncDoc['type'], payload: Record<string, unknown>, updatedAt: string): SyncDoc {
  return { _id: id, type, payload, updatedAt, serverBase: null };
}

describe('defaultStrategy', () => {
  it('parameter → lww, depth → manual, canal/meta → server-wins', () => {
    expect(defaultStrategy('parameter')).toBe('lww');
    expect(defaultStrategy('depth')).toBe('manual');
    expect(defaultStrategy('canal')).toBe('server-wins');
    expect(defaultStrategy('meta')).toBe('server-wins');
  });
});

describe('extractConflicts', () => {
  it('hanya ambil hasil push yang ok:false', () => {
    const l = doc('depth:k:1', 'depth', { depth: 2.5 }, 'B');
    const s = doc('depth:k:1', 'depth', { depth: 2.7 }, 'A');
    const results: PushResult[] = [
      { id: 'depth:k:2', ok: true },
      { id: 'depth:k:1', ok: false, conflict: { lokal: l, server: s } },
    ];
    const conf = extractConflicts(results);
    expect(conf).toHaveLength(1);
    expect(conf[0]!.docId).toBe('depth:k:1');
    expect(conf[0]!.strategy).toBe('manual');
  });
});

describe('resolveSingle', () => {
  it('pilih lokal → payload lokal + serverBase = updatedAt server', () => {
    const c = toConflictItem(
      doc('depth:k:1', 'depth', { depth: 2.84 }, '2026-06-15T10:00:00Z'),
      doc('depth:k:1', 'depth', { depth: 2.71 }, '2026-06-15T09:00:00Z'),
    );
    const out = resolveSingle(c, 'lokal');
    expect((out.payload as { depth: number }).depth).toBe(2.84);
    expect(out.serverBase).toBe('2026-06-15T09:00:00Z');
  });

  it('pilih server → payload server', () => {
    const c = toConflictItem(
      doc('depth:k:1', 'depth', { depth: 2.84 }, 'B'),
      doc('depth:k:1', 'depth', { depth: 2.71 }, 'A'),
    );
    expect((resolveSingle(c, 'server').payload as { depth: number }).depth).toBe(2.71);
  });
});

describe('resolveMulti', () => {
  it('merge per-field: ambil sisi sesuai picks, sisanya lokal', () => {
    const c = toConflictItem(
      doc('parameter:k', 'parameter', { water_level: 2.15, tranducer: 0.45, bed_float: 0.08 }, 'B'),
      doc('parameter:k', 'parameter', { water_level: 2.18, tranducer: 0.48, bed_float: 0.08 }, 'A'),
    );
    const out = resolveMulti(c, { water_level: 'server', tranducer: 'lokal' });
    const p = out.payload as Record<string, number>;
    expect(p.water_level).toBe(2.18); // server
    expect(p.tranducer).toBe(0.45); // lokal
    expect(p.bed_float).toBe(0.08); // unchanged (lokal)
  });
});

describe('autoResolve', () => {
  it('lww → menang yang updatedAt lebih baru', () => {
    const c = toConflictItem(
      doc('parameter:k', 'parameter', { water_level: 2.15 }, '2026-06-15T10:00:00Z'),
      doc('parameter:k', 'parameter', { water_level: 2.18 }, '2026-06-15T09:00:00Z'),
    );
    expect((autoResolve(c).payload as { water_level: number }).water_level).toBe(2.15);
  });

  it('server-wins → selalu server', () => {
    const c = toConflictItem(
      doc('canal:k', 'canal', { status: 'In Progress' }, 'B'),
      doc('canal:k', 'canal', { status: 'Done' }, 'A'),
    );
    expect((autoResolve(c).payload as { status: string }).status).toBe('Done');
  });
});

describe('diffFields', () => {
  it('tandai field sama vs beda', () => {
    const c = toConflictItem(
      doc('parameter:k', 'parameter', { water_level: 2.15, bed_float: 0.08 }, 'B'),
      doc('parameter:k', 'parameter', { water_level: 2.18, bed_float: 0.08 }, 'A'),
    );
    const diffs = diffFields(c);
    const wl = diffs.find((d) => d.field === 'water_level')!;
    const bf = diffs.find((d) => d.field === 'bed_float')!;
    expect(wl.same).toBe(false);
    expect(bf.same).toBe(true);
  });
});

describe('store konflik (in-memory + pub/sub)', () => {
  beforeEach(() => {
    for (const c of list()) remove(c.docId);
  });

  function mk(id: string): ConflictItem {
    return toConflictItem(doc(id, 'depth', { depth: 1 }, 'B'), doc(id, 'depth', { depth: 2 }, 'A'));
  }

  it('add/remove/count', () => {
    expect(count()).toBe(0);
    add(mk('depth:k:1'));
    expect(count()).toBe(1);
    remove('depth:k:1');
    expect(count()).toBe(0);
  });

  it('dedupe by docId (add ulang = replace)', () => {
    add(mk('depth:k:1'));
    add(mk('depth:k:1'));
    expect(count()).toBe(1);
  });

  it('addMany + subscribe notifikasi', () => {
    let got = 0;
    const unsub = subscribe((items) => (got = items.length));
    addMany([mk('depth:k:1'), mk('depth:k:2')]);
    expect(got).toBe(2);
    expect(count()).toBe(2);
    unsub();
  });
});
