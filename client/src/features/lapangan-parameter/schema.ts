/**
 * schema.ts — bentuk + validasi form Parameter QC (DOMAIN.md poin 9 + poin 3/7).
 *
 * FE-only: form ini ditulis ke PouchDB doc `parameter:<canalId>` lewat sync engine.
 * Field-nya jadi cikal-bakal `CanalDataSegment` (shared/types) saat diproyeksikan
 * server. Aturan validasi sengaja sinkron dgn `validateSegment` slice [data]:
 *   - Order No 10 digit numerik
 *   - Operation No default 0010 (warning, TIDAK block)
 *   - Measure Point numerik tanpa spasi
 *   - max 3 desimal utk water_level/tranducer/bed_float/depth_correction
 *   - panjang kanal = Σ STA (end − start)
 *   - ID kanal di parameter HARUS = ID kanal assignment (page 3)
 */
import { z } from 'zod';

/** Regex helper greppable (dipakai validator inline + zod refine). */
export const ORDER_NO_RE = /^\d{10}$/;
export const MEASURE_POINT_RE = /^\d+$/;
export const NO_SPACE_RE = /^\S*$/;
export const DEFAULT_OPERATION_NO = '0010';

/** Maks 3 angka di belakang titik (string desimal). Kosong dianggap valid. */
export function maxThreeDecimals(raw: string): boolean {
  if (!raw.trim()) return true;
  const dec = raw.split('.')[1];
  return !dec || dec.length <= 3;
}

const decimalField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d*\.?\d*$/.test(v), `${label} harus angka`)
    .refine(maxThreeDecimals, 'Maks 3 angka di belakang titik');

/**
 * Schema form. `canalId` (assignment) di-inject sebagai konteks lewat
 * `parameterSchema(canalIdRef)` supaya refine "ID kanal match" bisa membandingkan.
 */
export function parameterSchema(assignedCanalId: string) {
  return z
    .object({
      // Info kanal
      canalId: z
        .string()
        .trim()
        .min(1, 'Canal ID wajib diisi')
        .refine(
          (v) => !assignedCanalId || v === assignedCanalId,
          `ID kanal harus = ${assignedCanalId} (sesuai penugasan / page 3)`,
        ),
      orderNo: z
        .string()
        .trim()
        .regex(ORDER_NO_RE, 'Order No harus 10 digit numerik'),
      operationNo: z.string().trim().min(1, 'Operation No wajib diisi'),
      district: z.string().trim().min(1, 'District wajib diisi'),
      contractor: z.string().trim().min(1, 'Contractor wajib diisi'),
      measurePoint: z
        .string()
        .trim()
        .regex(NO_SPACE_RE, 'Measure Point tanpa spasi')
        .regex(MEASURE_POINT_RE, 'Measure Point harus numerik'),
      startSta: z.coerce.number({ invalid_type_error: 'Angka' }).min(0, 'Min 0'),
      endSta: z.coerce.number({ invalid_type_error: 'Angka' }).min(0, 'Min 0'),
      panjang: z.coerce.number({ invalid_type_error: 'Angka' }).min(1, 'Min 1 m'),
      dimensi: z.string().trim().min(1, 'Dimensi wajib diisi'),
      coordX: z.coerce.number({ invalid_type_error: 'Angka' }),
      coordY: z.coerce.number({ invalid_type_error: 'Angka' }),

      // Parameter pengukuran
      waterLevel: decimalField('Water level'),
      tranducer: decimalField('Tranducer'),
      bedFloat: decimalField('Bed float'),
      depthCorrection: decimalField('Depth correction'),
      qcType: z.enum(['QC', 'RE-QC']),
      revision: z.string().trim().regex(/^\d{1,3}$/, 'Revision 1–3 digit'),

      // Tanggal
      qcDate: z.string().min(1, 'QC Date wajib diisi'),
      measureDate: z.string().min(1, 'Measure Date wajib diisi'),
    })
    .superRefine((v, ctx) => {
      // Panjang = Σ STA (end − start). DOMAIN.md poin 9.
      const span = v.endSta - v.startSta;
      if (span !== v.panjang) {
        ctx.addIssue({
          path: ['panjang'],
          code: z.ZodIssueCode.custom,
          message: `Panjang (${v.panjang}) harus = End STA − Start STA (${span})`,
        });
      }
    });
}

export type ParameterFormValues = z.input<ReturnType<typeof parameterSchema>>;
export type ParameterFormOutput = z.output<ReturnType<typeof parameterSchema>>;

/**
 * Warning lunak (tidak memblokir submit) — dirender terpisah dari error zod.
 * Operation No != 0010 → ingatkan operator (DOMAIN.md poin 9).
 */
export function softWarnings(v: Partial<ParameterFormValues>): string[] {
  const w: string[] = [];
  if (v.operationNo && v.operationNo.trim() !== DEFAULT_OPERATION_NO) {
    w.push(`Operation No bukan default ${DEFAULT_OPERATION_NO} — pastikan sesuai SOP.`);
  }
  return w;
}
