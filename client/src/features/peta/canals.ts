/**
 * Sumber data marker peta (FE-only, Phase 1 demo).
 *
 * Subset field `Canal` yang relevan untuk pin peta. Koordinat disimpan sebagai UTM
 * 48S (Easting/Northing) — SAMA seperti yang datang dari Excel AOI (DOMAIN.md
 * "Koordinat") — lalu di-convert ke WGS84 lewat `shared/domain/utm.utmToLatLng`
 * saat render Leaflet. Sengaja TIDAK hardcode lat/lng supaya jalur konversi
 * proj4 (EPSG:32748) ikut teruji di UI nyata.
 *
 * Nanti diganti query nyata (slice penugasan/undangan) — shape sengaja dekat dgn
 * `Canal` di shared/types.ts supaya swap-nya mulus.
 */
import type { CanalStatus, RequestType } from '../../shared/types.js';

/** Baris kanal minimal yang dibutuhkan peta. */
export interface PetaCanal {
  canalId: string;
  orderNo: string;
  district: string;
  contractor: string;
  requestType: RequestType;
  status: CanalStatus;
  /** UTM Easting (zona 48S). */
  coordX: number;
  /** UTM Northing (zona 48S). */
  coordY: number;
}

/**
 * Subset AOI SUMSEL P1 (mirror dari demo `MOCK.undangan`). Koordinat UTM asli.
 * Status memetakan flow DOMAIN: Submitted/Assigned/In Progress/Done.
 */
export const PETA_CANALS: PetaCanal[] = [
  { canalId: 'SB180200', orderNo: '2000349188', district: 'D.SUNGAI_BEYUKU',      contractor: 'PT CIPTA BUANA SAMUDRA',   requestType: 'QC',    status: 'Assigned',    coordX: 540840, coordY: 9674337 },
  { canalId: 'SB180202', orderNo: '2000349189', district: 'D.SUNGAI_BEYUKU',      contractor: 'PT CIPTA BUANA SAMUDRA',   requestType: 'QC',    status: 'In Progress', coordX: 540840, coordY: 9673402 },
  { canalId: 'SB180204', orderNo: '2000349190', district: 'D.SUNGAI_BEYUKU',      contractor: 'PT CIPTA BUANA SAMUDRA',   requestType: 'QC',    status: 'Submitted',   coordX: 540869, coordY: 9672320 },
  { canalId: 'SP223200', orderNo: '2000348941', district: 'D.SUNGAI_PENYABUNGAN', contractor: 'PT PUTRA RIMBA NUSANTARA', requestType: 'QC',    status: 'Assigned',    coordX: 544264, coordY: 9653212 },
  { canalId: 'SP223204', orderNo: '2000348942', district: 'D.SUNGAI_PENYABUNGAN', contractor: 'PT PUTRA RIMBA NUSANTARA', requestType: 'QC',    status: 'Submitted',   coordX: 546259, coordY: 9653944 },
  { canalId: 'SP223206', orderNo: '2000348943', district: 'D.SUNGAI_PENYABUNGAN', contractor: 'PT PUTRA RIMBA NUSANTARA', requestType: 'QC',    status: 'Submitted',   coordX: 547140, coordY: 9654291 },
  { canalId: 'SP223208', orderNo: '2000348944', district: 'D.SUNGAI_PENYABUNGAN', contractor: 'PT PUTRA RIMBA NUSANTARA', requestType: 'QC',    status: 'Assigned',    coordX: 547839, coordY: 9654548 },
  { canalId: 'SPFB1400', orderNo: '2000349398', district: 'D.SUNGAI_PENYABUNGAN', contractor: 'PT MUSI NAULI LESTARI',   requestType: 'QC',    status: 'In Progress', coordX: 548226, coordY: 9654589 },
  { canalId: 'AS091200', orderNo: '2000349402', district: 'D.AIR_SUGIHAN',        contractor: 'PT MUSI NAULI LESTARI',   requestType: 'RE-QC', status: 'Submitted',   coordX: 552014, coordY: 9648770 },
  { canalId: 'SB180188', orderNo: '2000349101', district: 'D.SUNGAI_BEYUKU',      contractor: 'PT CIPTA BUANA SAMUDRA',   requestType: 'QC',    status: 'Done',        coordX: 540210, coordY: 9675102 },
  { canalId: 'SP223150', orderNo: '2000348880', district: 'D.SUNGAI_PENYABUNGAN', contractor: 'PT PUTRA RIMBA NUSANTARA', requestType: 'QC',    status: 'Done',        coordX: 543880, coordY: 9652990 },
];
