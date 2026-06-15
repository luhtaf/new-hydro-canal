/**
 * SegmentForm — form field canal_data segment (dipakai AddData & EditData).
 * Field mengikuti CanalDataSegment (types.ts). Validasi sederhana di level wrapper.
 *
 * Aturan domain yang relevan (DOMAIN.md poin 9): Measure Point wajib tanpa spasi,
 * max 3 desimal untuk water_level/tranducer/bed_float/depth_correction → divalidasi
 * lewat pattern di field + summary di wrapper.
 */
import type { CanalDataSegment } from '../../../shared/types.js';

export type SegmentFormValues = {
  canal_id: string;
  order_no: string;
  operation_no: string;
  start: string;
  end: string;
  measure_point: string;
  water_level: string;
  depth_correction: string;
  bed_float: string;
  tranducer: string;
  revision: string;
  qc_type: string;
  operator: string;
  qc_date: string;
  measure_date: string;
  usv_code: string;
  district_name: string;
  district_code: string;
  region: string;
  canal_upper_width: string;
  canal_bottom_width: string;
  canal_length: string;
  lane: string;
  content_name: string;
  coord_x: string;
  coord_y: string;
  dim_panjang: string;
  dim_lebar: string;
  dim_tinggi: string;
};

export const EMPTY_SEGMENT: SegmentFormValues = {
  canal_id: '',
  order_no: '',
  operation_no: '0010',
  start: '',
  end: '',
  measure_point: '',
  water_level: '0',
  depth_correction: '0',
  bed_float: '0',
  tranducer: '0',
  revision: '000',
  qc_type: 'QC',
  operator: '',
  qc_date: '',
  measure_date: '',
  usv_code: '',
  district_name: '',
  district_code: '',
  region: '',
  canal_upper_width: '0',
  canal_bottom_width: '0',
  canal_length: '0',
  lane: '1',
  content_name: '',
  coord_x: '',
  coord_y: '',
  dim_panjang: '0',
  dim_lebar: '0',
  dim_tinggi: '0',
};

/** Konversi segment server → form values (string). */
export function segmentToForm(s: CanalDataSegment): SegmentFormValues {
  return {
    canal_id: s.canal_id ?? '',
    order_no: s.order_no ?? '',
    operation_no: s.operation_no ?? '0010',
    start: s.start ?? '',
    end: s.end ?? '',
    measure_point: s.measure_point ?? '',
    water_level: String(s.water_level ?? '0'),
    depth_correction: String(s.depth_correction ?? '0'),
    bed_float: String(s.bed_float ?? '0'),
    tranducer: String(s.tranducer ?? 0),
    revision: s.revision ?? '000',
    qc_type: s.qc_type ?? 'QC',
    operator: s.operator ?? '',
    qc_date: s.qc_date ?? '',
    measure_date: s.measure_date ?? '',
    usv_code: s.usv_code ?? '',
    district_name: s.district?.name ?? '',
    district_code: s.district?.code ?? '',
    region: s.region ?? '',
    canal_upper_width: String(s.canal_upper_width ?? 0),
    canal_bottom_width: String(s.canal_bottom_width ?? 0),
    canal_length: String(s.canal_length ?? 0),
    lane: String(s.lane ?? 1),
    content_name: s.content_name ?? '',
    coord_x: s.coord_x != null ? String(s.coord_x) : '',
    coord_y: s.coord_y != null ? String(s.coord_y) : '',
    dim_panjang: String(s.dimensi?.panjang ?? 0),
    dim_lebar: String(s.dimensi?.lebar ?? 0),
    dim_tinggi: String(s.dimensi?.tinggi ?? 0),
  };
}

/** Konversi form values → payload partial segment server. */
export function formToSegment(v: SegmentFormValues): Partial<CanalDataSegment> {
  const n = (x: string) => {
    const p = parseFloat(x);
    return Number.isFinite(p) ? p : 0;
  };
  return {
    canal_id: v.canal_id.trim(),
    order_no: v.order_no.trim(),
    operation_no: v.operation_no.trim(),
    start: v.start.trim(),
    end: v.end.trim(),
    measure_point: v.measure_point.trim(),
    water_level: v.water_level,
    depth_correction: v.depth_correction,
    bed_float: v.bed_float,
    tranducer: n(v.tranducer),
    revision: v.revision.trim(),
    qc_type: v.qc_type,
    operator: v.operator.trim(),
    qc_date: v.qc_date,
    measure_date: v.measure_date,
    usv_code: v.usv_code.trim(),
    district: { name: v.district_name.trim(), code: v.district_code.trim() },
    region: v.region.trim(),
    canal_upper_width: n(v.canal_upper_width),
    canal_bottom_width: n(v.canal_bottom_width),
    canal_length: n(v.canal_length),
    lane: n(v.lane),
    content_name: v.content_name.trim(),
    coord_x: v.coord_x ? n(v.coord_x) : undefined,
    coord_y: v.coord_y ? n(v.coord_y) : undefined,
    dimensi: {
      panjang: n(v.dim_panjang),
      lebar: n(v.dim_lebar),
      tinggi: n(v.dim_tinggi),
    },
  };
}

/** Validasi field: kembalikan pesan error per field (DOMAIN.md poin 9). */
export function validateSegment(v: SegmentFormValues): Partial<Record<keyof SegmentFormValues, string>> {
  const err: Partial<Record<keyof SegmentFormValues, string>> = {};
  if (!v.canal_id.trim()) err.canal_id = 'Wajib diisi';
  if (v.order_no && !/^\d{10}$/.test(v.order_no.trim()))
    err.order_no = 'Order No harus 10 digit numerik';
  if (v.measure_point && /\s/.test(v.measure_point))
    err.measure_point = 'Measure Point tanpa spasi';
  if (v.measure_point && !/^\d+$/.test(v.measure_point.trim()))
    err.measure_point = 'Measure Point harus numerik';
  const max3 = (x: string) => {
    const dec = x.split('.')[1];
    return !dec || dec.length <= 3;
  };
  (['water_level', 'tranducer', 'bed_float', 'depth_correction'] as const).forEach(
    (f) => {
      if (!max3(v[f])) err[f] = 'Maks 3 angka di belakang titik';
    },
  );
  return err;
}

// ── Komponen field generik ──────────────────────────────────────────────────

interface FieldProps {
  label: string;
  name: keyof SegmentFormValues;
  values: SegmentFormValues;
  errors: Partial<Record<keyof SegmentFormValues, string>>;
  onChange: (name: keyof SegmentFormValues, value: string) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
}

export function Field({
  label,
  name,
  values,
  errors,
  onChange,
  type = 'text',
  placeholder,
  mono,
}: FieldProps) {
  const err = errors[name];
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={values[name]}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        className={`input input-sm ${mono ? 'font-mono' : ''} ${
          err ? 'border-rose-400 ring-1 ring-rose-200' : ''
        }`}
      />
      {err && <p className="mt-0.5 text-xs text-rose-600">{err}</p>}
    </div>
  );
}

export function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}
