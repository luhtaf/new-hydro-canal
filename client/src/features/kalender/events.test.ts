import { describe, it, expect } from 'vitest';
import type { Canal } from '../../shared/types.js';
import {
  deriveEvents,
  buildMonthEvents,
  buildMonthGrid,
  dayKey,
} from './events.js';

function canal(over: Partial<Canal>): Canal {
  return {
    _id: 'c1',
    aoiId: 'a1',
    district: 'D.SUNGAI_BEYUKU',
    orderNo: '2000349189',
    requestDate: '2026-05-17',
    requestType: 'QC',
    canalId: 'SB180202',
    panjang: 1000,
    dimensi: '8X5X3',
    measurePoint: '382956',
    startDate: '2026-05-18',
    finishDate: '2026-05-31',
    contractor: 'PT CIPTA BUANA SAMUDRA',
    coordX: 540840,
    coordY: 9673402,
    status: 'Submitted',
    assignedTo: null,
    assignedAt: null,
    usv: null,
    qcOutput: null,
    dataId: null,
    createdAt: '2026-05-17',
    updatedAt: '2026-05-17',
    ...over,
  };
}

const NOW = new Date(2026, 4, 17); // 17 Mei 2026 lokal

describe('deriveEvents', () => {
  it('canal Submitted → undangan + deadline (tanpa penugasan)', () => {
    const ev = deriveEvents([canal({ status: 'Submitted' })], NOW);
    const kinds = ev.map((e) => e.kind).sort();
    expect(kinds).toEqual(['dl', 'und']);
  });

  it('deadline = requestDate + 4 hari (DOMAIN poin 1)', () => {
    const ev = deriveEvents([canal({ requestDate: '2026-05-17' })], NOW);
    const dl = ev.find((e) => e.kind === 'dl')!;
    expect(dayKey(dl.date)).toBe(dayKey(new Date(2026, 4, 21)));
  });

  it('canal Assigned/In Progress/Done → tambah event penugasan di startDate', () => {
    const ev = deriveEvents(
      [canal({ status: 'Assigned', startDate: '2026-05-19', usv: 'KBN01' })],
      NOW,
    );
    const pen = ev.find((e) => e.kind === 'pen')!;
    expect(pen).toBeDefined();
    expect(dayKey(pen.date)).toBe(dayKey(new Date(2026, 4, 19)));
    expect(pen.title).toContain('KBN01');
  });

  it('requestDate kosong/invalid → tidak crash, tidak ada event und/dl', () => {
    const ev = deriveEvents([canal({ requestDate: '', status: 'Submitted' })], NOW);
    expect(ev).toEqual([]);
  });
});

describe('buildMonthEvents', () => {
  it('kelompokkan per hari + dot dominan (deadline > penugasan > undangan)', () => {
    // Buat 1 hari yang punya undangan & deadline bertumpuk
    const c = canal({ requestDate: '2026-05-21', status: 'Submitted' }); // deadline 25 Mei
    const c2 = canal({
      _id: 'c2',
      requestDate: '2026-05-17',
      status: 'Submitted',
    }); // deadline 21 Mei → tumpuk dgn undangan c
    const ev = deriveEvents([c, c2], NOW);
    const { byDay, dotByDay } = buildMonthEvents(ev, 2026, 4);
    const k21 = dayKey(new Date(2026, 4, 21));
    // 21 Mei: undangan c + deadline c2 → dot harus 'dl' (prioritas tertinggi)
    expect(byDay.get(k21)?.length).toBe(2);
    expect(dotByDay.get(k21)).toBe('dl');
  });

  it('saring event di luar bulan target', () => {
    const ev = deriveEvents([canal({ requestDate: '2026-06-10' })], NOW);
    const { byDay } = buildMonthEvents(ev, 2026, 4); // Mei
    expect(byDay.size).toBe(0);
  });
});

describe('buildMonthGrid', () => {
  it('Mei 2026 mulai Jumat → 4 sel kosong di depan (Mon=0)', () => {
    const grid = buildMonthGrid(2026, 4);
    // 1 Mei 2026 = Jumat. Mon=0 → Jumat index 4.
    expect(grid.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[4]).toBe(1);
    expect(grid[grid.length - 1]).toBe(31);
  });

  it('jumlah hari sesuai bulan (Feb 2026 = 28)', () => {
    const grid = buildMonthGrid(2026, 1);
    expect(grid.filter((d) => d !== null).length).toBe(28);
  });
});
