/**
 * Sumber data canal untuk kalender.
 *
 * SEMENTARA: slice [penugasan]/[undangan] (query canal nyata) belum ada, jadi di
 * sini pakai sample dari DOMAIN.md "Sample data (dari Excel asli WM)" + variasi
 * deadline supaya kalender hidup. Saat slice canal/penugasan tersedia, GANTI isi
 * hook ini dengan TanStack Query `useCanals()` — permukaan (return Canal[]) tetap
 * supaya KalenderPage tidak berubah.
 *
 * Anchor tanggal sample digeser relatif ke `now` (Mei 2026 → bulan berjalan)
 * supaya event selalu jatuh di bulan yang ditampilkan saat demo.
 */
import { useMemo } from 'react';
import type { Canal, CanalStatus, RequestType, UsvCode } from '../../shared/types.js';

interface SampleRow {
  district: string;
  orderNo: string;
  reqOffset: number; // hari relatif ke awal bulan tampil
  type: RequestType;
  canalId: string;
  panjang: number;
  dimensi: string;
  measurePoint: string;
  contractor: string;
  coordX: number;
  coordY: number;
  status: CanalStatus;
  usv: UsvCode | null;
  startOffset: number;
}

/** Baris contoh — diturunkan dari sample DOMAIN.md + variasi status untuk demo. */
const SAMPLE: SampleRow[] = [
  { district: 'D.SUNGAI_BEYUKU', orderNo: '2000349188', reqOffset: 10, type: 'QC', canalId: 'SB180200', panjang: 1000, dimensi: '8X5X3', measurePoint: '382955', contractor: 'PT CIPTA BUANA SAMUDRA', coordX: 540840, coordY: 9674337, status: 'In Progress', usv: 'KBN01', startOffset: 11 },
  { district: 'D.SUNGAI_BEYUKU', orderNo: '2000349189', reqOffset: 10, type: 'QC', canalId: 'SB180202', panjang: 1000, dimensi: '8X5X3', measurePoint: '382956', contractor: 'PT CIPTA BUANA SAMUDRA', coordX: 540840, coordY: 9673402, status: 'Assigned', usv: 'KBN01', startOffset: 12 },
  { district: 'D.SUNGAI_BEYUKU', orderNo: '2000349190', reqOffset: 11, type: 'QC', canalId: 'SB180204', panjang: 998, dimensi: '8X5X3', measurePoint: '382957', contractor: 'PT CIPTA BUANA SAMUDRA', coordX: 540869, coordY: 9672320, status: 'Done', usv: 'KBN02', startOffset: 12 },
  { district: 'D.SUNGAI_PENYABUNGAN', orderNo: '2000348941', reqOffset: 13, type: 'QC', canalId: 'SP223200', panjang: 1107, dimensi: '10X7X3', measurePoint: '382373', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 544264, coordY: 9653212, status: 'Submitted', usv: null, startOffset: 14 },
  { district: 'D.SUNGAI_PENYABUNGAN', orderNo: '2000348942', reqOffset: 14, type: 'QC', canalId: 'SP223204', panjang: 1016, dimensi: '10X7X3', measurePoint: '382375', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 546259, coordY: 9653944, status: 'Assigned', usv: 'KBN03', startOffset: 19 },
  { district: 'D.SUNGAI_PENYABUNGAN', orderNo: '2000349398', reqOffset: 15, type: 'QC', canalId: 'SPFB1400', panjang: 1009, dimensi: '8X5X3', measurePoint: '382999', contractor: 'PT MUSI NAULI LESTARI', coordX: 548226, coordY: 9654589, status: 'In Progress', usv: 'KBN04', startOffset: 20 },
];

/** Format Date → "YYYY-MM-DD" lokal (tanpa geser TZ). */
function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

/**
 * Canal[] untuk kalender. `now` menentukan bulan anchor (default sekarang).
 * Saat slice canal nyata siap → ganti body jadi `useQuery(['canals'], ...)`.
 */
export function useCalendarData(now: Date = new Date()): Canal[] {
  return useMemo(() => {
    const base = new Date(now.getFullYear(), now.getMonth(), 1);
    const at = (offset: number) => {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      return iso(d);
    };
    const finish = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return SAMPLE.map<Canal>((r) => ({
      _id: r.orderNo,
      aoiId: 'aoi-sample',
      district: r.district,
      orderNo: r.orderNo,
      requestDate: at(r.reqOffset),
      requestType: r.type,
      canalId: r.canalId,
      panjang: r.panjang,
      dimensi: r.dimensi,
      measurePoint: r.measurePoint,
      startDate: at(r.startOffset),
      finishDate: finish,
      contractor: r.contractor,
      coordX: r.coordX,
      coordY: r.coordY,
      status: r.status,
      assignedTo: r.usv ? 'op-sample' : null,
      assignedAt: r.usv ? at(r.reqOffset) : null,
      usv: r.usv,
      qcOutput: r.status === 'Done' ? `${r.canalId}.txt` : null,
      dataId: null,
      createdAt: at(r.reqOffset),
      updatedAt: at(r.reqOffset),
    }));
  }, [now]);
}
