/**
 * Sample data untuk preview chart kedalaman di section Threshold.
 *
 * Bukan data nyata — hanya 12 titik sintetis sepanjang STA supaya admin bisa
 * melihat re-color bar realtime saat menggeser threshold. Segment dibuat dengan
 * parameter offset nol (water_level/tranducer/bed_float/depth_correction = 0) →
 * `displayedDepth(raw) = -raw`, jadi raw 2.1–3.0 tampil sebagai bar 2.1–3.0 m
 * ke bawah dan dibandingkan ke threshold lewat nilai absolutnya.
 */
import type { CanalDataSegment, DepthPoint } from '../../../shared/types.js';

/** Segment dummy dengan offset 0 (lihat depthMath.displayedDepth). */
export const SAMPLE_SEGMENT: CanalDataSegment = {
  canal_id: 'PREVIEW',
  dimensi: { panjang: 220, lebar: 8, tinggi: 5 },
  order_no: '0000000000',
  operation_no: '0010',
  start: '',
  end: '',
  measure_point: '000000',
  water_level: '0',
  depth_correction: '0',
  bed_float: '0',
  revision: '000',
  qc_type: 'QC',
  operator: '',
  qc_date: '',
  measure_date: '',
  usv_code: 'KBN01',
  district: { name: 'PREVIEW', code: '0000' },
  canal_upper_width: 8,
  canal_bottom_width: 5,
  canal_length: 220,
  tranducer: 0,
  lane: 1,
  content_name: 'PREVIEW',
  data: [],
};

/** Profil kedalaman sintetis (raw, m) — variasi melewati pita pass/tol/fail. */
const RAW_PROFILE = [2.62, 2.71, 2.55, 2.34, 2.18, 2.05, 1.92, 2.12, 2.4, 2.58, 2.78, 2.66];

export const SAMPLE_POINTS: DepthPoint[] = RAW_PROFILE.map((depth, i) => ({
  lattitude: 0,
  longitude: 0,
  time: '',
  depth,
  sta: i * 20,
  sta_distance: 20,
}));
