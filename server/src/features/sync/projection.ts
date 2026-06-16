/**
 * PROJECTION — doc kecil flat (PouchDB) ⇄ schema `Data` nested (Mongo).
 *
 * Spec § D "doc kecil flat + projection": offline menulis doc kecil
 * (`parameter:<canalId>`, `depth:<canalId>:<sta>`), server merakit jadi `Data`
 * nested (`canal_data[] > data[]`). Ini men-decouple model-sync dari schema legacy.
 *
 * - parameter:<canalId>  → field segmen `canal_data[].*` (WL, tranducer, dimensi, dll)
 * - depth:<canalId>:<sta> → 1 titik di `canal_data[].data[]` (sta + depth + koordinat)
 *
 * Final depth formula (DOMAIN.md poin 4) dipakai HANYA saat render/export, bukan saat
 * simpan: yang disimpan adalah `raw_depth`. Sync menyimpan apa yang dikirim client.
 */
import type { SyncDoc, CanalDataSegment, DepthPoint } from '../../shared/types.js';

/** _id PouchDB: "parameter:<canalId>". */
export function parameterDocId(canalId: string): string {
  return `parameter:${canalId}`;
}

/** _id PouchDB: "depth:<canalId>:<sta>". */
export function depthDocId(canalId: string, sta: number | string): string {
  return `depth:${canalId}:${sta}`;
}

/** Parse _id flat → bagian-bagiannya. Return null kalau format tak dikenal. */
export function parseDocId(
  id: string,
): { kind: 'parameter'; canalId: string } | { kind: 'depth'; canalId: string; sta: number } | null {
  const parts = id.split(':');
  if (parts[0] === 'parameter' && parts[1]) {
    return { kind: 'parameter', canalId: parts.slice(1).join(':') };
  }
  if (parts[0] === 'depth' && parts[1] && parts[2] !== undefined) {
    const sta = Number(parts[parts.length - 1]);
    const canalId = parts.slice(1, -1).join(':');
    if (!Number.isNaN(sta) && canalId) return { kind: 'depth', canalId, sta };
  }
  return null;
}

/** Payload doc parameter — subset field segmen yang diisi operator di form parameter. */
export type ParameterPayload = Partial<
  Pick<
    CanalDataSegment,
    | 'order_no'
    | 'operation_no'
    | 'start'
    | 'end'
    | 'measure_point'
    | 'water_level'
    | 'depth_correction'
    | 'bed_float'
    | 'revision'
    | 'qc_type'
    | 'operator'
    | 'qc_date'
    | 'measure_date'
    | 'usv_code'
    | 'region'
    | 'canal_upper_width'
    | 'canal_bottom_width'
    | 'canal_length'
    | 'tranducer'
    | 'lane'
    | 'content_name'
    | 'coord_x'
    | 'coord_y'
  >
> & {
  canal_id: string;
  dimensi?: { panjang: number; lebar: number; tinggi: number };
  district?: { name: string; code: string };
  /** Tanggal pengukuran aktual (sebelum clamp) — server clamp ke finishDate. */
  measure_date_actual?: string;
};

/** Payload doc depth — 1 titik kedalaman. */
export type DepthPayload = {
  canal_id: string;
  sta: number;
  depth: number;
  sta_distance?: number;
  lattitude?: number; // sic — ejaan legacy
  longitude?: number;
  time?: string;
};

/**
 * Clamp Measure Date (DOMAIN.md poin 3): jika tanggal pengukuran aktual > Finish Date
 * AOI → set ke Finish Date. Return ISO string yang dipakai.
 */
export function clampMeasureDate(
  measureDateActual: string | undefined,
  finishDate: string | Date | undefined,
): { value: string | undefined; clamped: boolean } {
  if (!measureDateActual) return { value: undefined, clamped: false };
  if (!finishDate) return { value: measureDateActual, clamped: false };
  const actual = new Date(measureDateActual).getTime();
  const finish = new Date(finishDate).getTime();
  if (Number.isNaN(actual) || Number.isNaN(finish)) {
    return { value: measureDateActual, clamped: false };
  }
  if (actual > finish) {
    return { value: new Date(finish).toISOString(), clamped: true };
  }
  return { value: measureDateActual, clamped: false };
}

/** Segmen default minimal — field wajib schema legacy diisi nilai aman. */
function emptySegment(canalId: string): CanalDataSegment {
  return {
    canal_id: canalId,
    dimensi: { panjang: 0, lebar: 0, tinggi: 0 },
    order_no: '',
    operation_no: '',
    start: '',
    end: '',
    measure_point: '',
    water_level: '0',
    depth_correction: '0',
    bed_float: '0',
    revision: '0',
    qc_type: '',
    operator: '',
    qc_date: '',
    measure_date: '',
    usv_code: '',
    district: { name: '', code: '' },
    canal_upper_width: 0,
    canal_bottom_width: 0,
    canal_length: 0,
    tranducer: 0,
    lane: 0,
    content_name: '',
    data: [],
  };
}

/** Shape Data nested yang dirakit projection (plain object, siap upsert ke Mongo). */
export interface ProjectedData {
  batang_canal_id: string;
  canal_data: CanalDataSegment[];
}

/**
 * Terapkan satu doc parameter ke ProjectedData (mutasi in-place, return ref).
 * Cari segmen by canal_id; kalau belum ada → buat. LWW: caller menentukan apakah
 * doc ini menang (di sini selalu di-apply; conflict ditangani sebelum sampai sini).
 */
export function applyParameter(
  data: ProjectedData,
  payload: ParameterPayload,
  opts: { finishDate?: string | Date } = {},
): { clampedMeasureDate: boolean } {
  let seg = data.canal_data.find((c) => c.canal_id === payload.canal_id);
  if (!seg) {
    seg = emptySegment(payload.canal_id);
    data.canal_data.push(seg);
  }

  const clampInput = payload.measure_date_actual ?? payload.measure_date;
  const { value: clampedMd, clamped } = clampMeasureDate(clampInput, opts.finishDate);

  const { canal_id: _canalId, measure_date_actual: _mda, ...rest } = payload;
  void _canalId;
  void _mda;
  Object.assign(seg, rest);
  if (clampedMd !== undefined) seg.measure_date = clampedMd;

  return { clampedMeasureDate: clamped };
}

/**
 * Terapkan satu doc depth ke ProjectedData. Cari segmen by canal_id; upsert titik
 * by STA (1 STA = 1 titik). Kedalaman strategi MANUAL → conflict ditangani sebelum
 * sampai sini; di sini kita tulis nilai yang sudah disepakati.
 */
export function applyDepth(data: ProjectedData, payload: DepthPayload): void {
  let seg = data.canal_data.find((c) => c.canal_id === payload.canal_id);
  if (!seg) {
    seg = emptySegment(payload.canal_id);
    data.canal_data.push(seg);
  }
  const point: DepthPoint = {
    sta: payload.sta,
    depth: payload.depth,
    sta_distance: payload.sta_distance ?? 0,
    lattitude: payload.lattitude ?? 0,
    longitude: payload.longitude ?? 0,
    time: payload.time ?? '',
  };
  const idx = seg.data.findIndex((d) => d.sta === payload.sta);
  if (idx >= 0) {
    seg.data[idx] = { ...seg.data[idx], ...point };
  } else {
    seg.data.push(point);
    seg.data.sort((a, b) => a.sta - b.sta);
  }
}

/**
 * REVERSE projection — Data nested → kumpulan doc kecil flat untuk pull/seed.
 * Dipakai saat client minta `pull`/`seed`: server pecah Data jadi parameter+depth
 * docs supaya PouchDB simpan model flat yang sama dengan yang ia tulis.
 */
export function dataToFlatDocs(
  data: ProjectedData,
  meta: { updatedAt: string; serverBase?: string | null },
): SyncDoc[] {
  const docs: SyncDoc[] = [];
  for (const seg of data.canal_data) {
    const { data: points, ...paramFields } = seg;
    docs.push({
      _id: parameterDocId(seg.canal_id),
      type: 'parameter',
      payload: paramFields as unknown as Record<string, unknown>,
      updatedAt: meta.updatedAt,
      serverBase: meta.serverBase ?? meta.updatedAt,
    });
    for (const p of points) {
      docs.push({
        _id: depthDocId(seg.canal_id, p.sta),
        type: 'depth',
        payload: { canal_id: seg.canal_id, ...p } as unknown as Record<string, unknown>,
        updatedAt: meta.updatedAt,
        serverBase: meta.serverBase ?? meta.updatedAt,
      });
    }
  }
  return docs;
}
