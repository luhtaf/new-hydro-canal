/**
 * Unit test slice penugasan — bagian PURE (`groupPenugasan`), tanpa DB.
 *
 * Cover: grouping Kontraktor → Distrik (DOMAIN.md poin 2), chip ringkasan (jumlah kanal,
 * total meter, jumlah distrik, deadline terdekat), sort kontraktor by deadline terdekat,
 * dan sort canal by deadline ascending.
 *
 * listMine/assign/unassign (butuh Mongo) di-cover test integrasi terpisah saat
 * mongodb-memory-server tersedia (lihat missingDeps).
 */
import { describe, it, expect } from 'vitest';
import { groupPenugasan, type PenugasanCanal } from './penugasan.service.js';

function card(over: Partial<PenugasanCanal> & { daysLeft: number }): PenugasanCanal {
  const { daysLeft, ...rest } = over;
  return {
    orderNo: '2000000000',
    canalId: 'SB180202',
    district: 'D.SUNGAI_BEYUKU',
    contractor: 'PT CIPTA BUANA SAMUDRA',
    panjang: 1000,
    dimensi: '8X5X3',
    measurePoint: '382956',
    coordX: 540840,
    coordY: 9673402,
    requestDate: '2026-05-17T00:00:00.000Z',
    startDate: '2026-05-01T00:00:00.000Z',
    finishDate: '2026-05-31T00:00:00.000Z',
    requestType: 'QC',
    status: 'Assigned',
    usv: 'KBN01',
    qcOutput: null,
    deadline: { daysLeft, label: `Sisa ${daysLeft} hari`, tone: 'emerald' },
    ...rest,
  };
}

describe('groupPenugasan', () => {
  it('group kosong → array kosong', () => {
    expect(groupPenugasan([])).toEqual([]);
  });

  it('group per kontraktor → distrik dgn chip ringkasan benar', () => {
    const groups = groupPenugasan([
      card({ contractor: 'PT CIPTA BUANA SAMUDRA', district: 'D.A', panjang: 1000, daysLeft: 3 }),
      card({ contractor: 'PT CIPTA BUANA SAMUDRA', district: 'D.A', panjang: 500, daysLeft: 2 }),
      card({ contractor: 'PT CIPTA BUANA SAMUDRA', district: 'D.B', panjang: 700, daysLeft: 4 }),
    ]);

    expect(groups).toHaveLength(1);
    const g = groups[0]!;
    expect(g.contractor).toBe('PT CIPTA BUANA SAMUDRA');
    expect(g.shortName).toBe('PT. CBS'); // dari shared/domain/shortName
    expect(g.summary.canalCount).toBe(3);
    expect(g.summary.districtCount).toBe(2);
    expect(g.summary.totalMeter).toBe(2200);
    expect(g.summary.nearest.daysLeft).toBe(2); // deadline terdekat
    expect(g.districts).toHaveLength(2);
  });

  it('total meter per distrik dihitung terpisah', () => {
    const [g] = groupPenugasan([
      card({ district: 'D.A', panjang: 1000, daysLeft: 3 }),
      card({ district: 'D.A', panjang: 998, daysLeft: 3 }),
      card({ district: 'D.B', panjang: 700, daysLeft: 3 }),
    ]);
    const dA = g!.districts.find((d) => d.district === 'D.A')!;
    const dB = g!.districts.find((d) => d.district === 'D.B')!;
    expect(dA.totalMeter).toBe(1998);
    expect(dB.totalMeter).toBe(700);
  });

  it('canal dalam distrik di-sort by deadline ascending (paling mepet di atas)', () => {
    const [g] = groupPenugasan([
      card({ canalId: 'C-far', district: 'D.A', daysLeft: 5 }),
      card({ canalId: 'C-near', district: 'D.A', daysLeft: 1 }),
      card({ canalId: 'C-mid', district: 'D.A', daysLeft: 3 }),
    ]);
    expect(g!.districts[0]!.canals.map((c) => c.canalId)).toEqual([
      'C-near',
      'C-mid',
      'C-far',
    ]);
  });

  it('kontraktor di-sort by deadline terdekat', () => {
    const groups = groupPenugasan([
      card({ contractor: 'PT PUTRA RIMBA NUSANTARA', daysLeft: 5 }),
      card({ contractor: 'PT CIPTA BUANA SAMUDRA', daysLeft: 1 }),
    ]);
    expect(groups.map((g) => g.contractor)).toEqual([
      'PT CIPTA BUANA SAMUDRA',
      'PT PUTRA RIMBA NUSANTARA',
    ]);
  });
});
