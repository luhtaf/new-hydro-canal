/**
 * Service Data — PORT logika existing (DataController.js app lama) ke TS strict.
 *
 * Inti port: pola POLYMORPHIC `:id`. Satu param `:id` bisa menunjuk 3 level berbeda
 * di schema nested `Data > canal_data[] > data[]`:
 *   - root Data `_id`              → MainData
 *   - `canal_data[]._id`          → 1 segmen canal
 *   - `canal_data[].data[]._id`   → 1 titik kedalaman
 *
 * Resolusi level dipertahankan persis: query bertingkat + update pakai positional `$`
 * + `arrayFilters` (bukan load-mutate-save) supaya atomic & hemat (sesuai existing).
 *
 * Final depth & reverse drag pakai shared/domain (DOMAIN.md poin 4 — sinkron FE/BE).
 */
import { dataModel } from './data.models.js';
import type { Data, CanalDataSegment, DepthPoint } from '../../shared/types.js';
import { reverseDepth, finalDepth } from '../../shared/domain/depth.js';
import { classifyThreshold } from '../../shared/domain/threshold.js';
import type { Threshold } from '../../shared/types.js';
import {
  segmentSet,
  pointSet,
  pointFiltersById,
  pointFiltersBySta,
} from './updatePaths.js';

/** Level tempat sebuah `:id` ditemukan di pohon Data. */
export type IdLevel = 'root' | 'segment' | 'point';

export interface ResolvedId {
  level: IdLevel;
  /** root Data doc yang memuat id tsb. */
  root: Data;
  /** segmen yang cocok (level segment/point). */
  segment?: CanalDataSegment;
  /** titik kedalaman yang cocok (level point). */
  point?: DepthPoint;
}

/** Error domain dengan status HTTP supaya error handler global memetakan benar. */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolusi polymorphic :id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cari di level mana `id` berada. Urutan probe = persis existing:
 * root dulu → segment → point. Lean (plain object) karena hanya baca.
 */
export async function resolveId(id: string): Promise<ResolvedId | null> {
  // 1) root Data._id
  const asRoot = await dataModel().findById(id).lean<Data>().exec();
  if (asRoot) return { level: 'root', root: asRoot };

  // 2) canal_data[]._id
  const asSegment = await dataModel().findOne({ 'canal_data._id': id })
    .lean<Data>()
    .exec();
  if (asSegment) {
    const segment = asSegment.canal_data.find((c) => String(c._id) === id);
    return { level: 'segment', root: asSegment, segment };
  }

  // 3) canal_data[].data[]._id
  const asPoint = await dataModel().findOne({ 'canal_data.data._id': id })
    .lean<Data>()
    .exec();
  if (asPoint) {
    for (const seg of asPoint.canal_data) {
      const point = seg.data.find((d) => String(d._id) === id);
      if (point) return { level: 'point', root: asPoint, segment: seg, point };
    }
  }

  return null;
}

/** Resolve atau lempar 404. */
export async function resolveIdOrThrow(id: string): Promise<ResolvedId> {
  const r = await resolveId(id);
  if (!r) throw new HttpError(`Data dengan id ${id} tidak ditemukan`, 404);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ (port: /datas/:id, /data/:id, /detaildata/:id, /dataschart, /datachart)
// ─────────────────────────────────────────────────────────────────────────────

export async function getVersion(): Promise<string> {
  return process.env.npm_package_version ?? '0.1.0';
}

export async function listAll(): Promise<Data[]> {
  return dataModel().find().lean<Data[]>().exec();
}

/** /datas/:id — MainData detail (root). */
export async function getMainData(id: string): Promise<Data> {
  const { root } = await resolveIdOrThrow(id);
  return root;
}

/** /data/:id — 1 segmen canal_data. */
export async function getSegment(id: string): Promise<CanalDataSegment> {
  const r = await resolveIdOrThrow(id);
  if (r.level !== 'segment' || !r.segment) {
    throw new HttpError(`id ${id} bukan canal_data segment`, 400);
  }
  return r.segment;
}

/** /detaildata/:id — 1 titik kedalaman. */
export async function getPoint(id: string): Promise<DepthPoint> {
  const r = await resolveIdOrThrow(id);
  if (r.level !== 'point' || !r.point) {
    throw new HttpError(`id ${id} bukan titik kedalaman`, 400);
  }
  return r.point;
}

/**
 * /dataschart/:id — data chart untuk SELURUH MainData (semua segmen).
 * Proyeksi tiap titik ke displayed depth + warna threshold.
 */
export async function getChartForRoot(
  id: string,
  threshold: Threshold | null,
): Promise<ChartSegment[]> {
  const { root } = await resolveIdOrThrow(id);
  return root.canal_data.map((seg) => projectSegment(seg, threshold));
}

/** /datachart/:id — data chart untuk 1 segmen. */
export async function getChartForSegment(
  id: string,
  threshold: Threshold | null,
): Promise<ChartSegment> {
  const seg = await getSegment(id);
  return projectSegment(seg, threshold);
}

// ─────────────────────────────────────────────────────────────────────────────
// Proyeksi chart (final depth + threshold) — sinkron dgn chartjs-node-canvas (qc slice)
// ─────────────────────────────────────────────────────────────────────────────

export interface ChartPoint {
  sta: number;
  /** depth mentah dari DB. */
  rawDepth: number;
  /** displayed depth (sudah final formula + flip). */
  displayed: number;
  /** klasifikasi warna (pass/tolerance/fail) atau null kalau threshold belum ada. */
  klass: ReturnType<typeof classifyThreshold> | null;
}

export interface ChartSegment {
  canalId: string;
  params: {
    waterLevel: number;
    tranducer: number;
    bedFloat: number;
    depthCorrection: number;
  };
  points: ChartPoint[];
}

function segParams(seg: CanalDataSegment) {
  return {
    waterLevel: Number(seg.water_level) || 0,
    tranducer: Number(seg.tranducer) || 0,
    bedFloat: Number(seg.bed_float) || 0,
    depthCorrection: Number(seg.depth_correction) || 0,
  };
}

function projectSegment(
  seg: CanalDataSegment,
  threshold: Threshold | null,
): ChartSegment {
  const p = segParams(seg);
  return {
    canalId: seg.canal_id,
    params: p,
    points: seg.data.map((d) => {
      const rawDepth = Number(d.depth) || 0;
      const displayed = finalDepth({
        depth: rawDepth,
        water_level: p.waterLevel,
        tranducer: p.tranducer,
        bed_float: p.bedFloat,
        depth_correction: p.depthCorrection,
      });
      return {
        sta: d.sta,
        rawDepth,
        displayed,
        // klasifikasi pakai magnitude depth (positif) sesuai DOMAIN.md poin 5.
        klass: threshold ? classifyThreshold(Math.abs(displayed), threshold) : null,
      };
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE (port: POST /datas, POST /data/:id, POST /detaildata/:id)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /datas — buat MainData baru. */
export async function createMainData(body: Partial<Data>): Promise<Data> {
  const doc = await dataModel().create(body);
  return doc.toObject() as Data;
}

/** POST /data/:id — push segmen canal_data ke root Data `:id`. */
export async function pushSegment(
  rootId: string,
  segment: Partial<CanalDataSegment>,
): Promise<Data> {
  const updated = await dataModel().findByIdAndUpdate(
    rootId,
    { $push: { canal_data: segment } },
    { new: true },
  )
    .lean<Data>()
    .exec();
  if (!updated) throw new HttpError(`MainData ${rootId} tidak ditemukan`, 404);
  return updated;
}

/**
 * POST /detaildata/:id — push titik kedalaman ke segmen `:id`.
 * `:id` di sini = canal_data._id (positional `$`).
 */
export async function pushPoint(
  segmentId: string,
  point: Partial<DepthPoint>,
): Promise<Data> {
  const updated = await dataModel().findOneAndUpdate(
    { 'canal_data._id': segmentId },
    { $push: { 'canal_data.$.data': point } },
    { new: true },
  )
    .lean<Data>()
    .exec();
  if (!updated)
    throw new HttpError(`Segmen ${segmentId} tidak ditemukan`, 404);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE (port: PATCH /datas/:id, /data/:id, /detaildata/:id)
// arrayFilters untuk update nested deep (titik di dalam segmen di dalam root).
// ─────────────────────────────────────────────────────────────────────────────

/** PATCH /datas/:id — update field root. */
export async function updateMainData(
  rootId: string,
  patch: Partial<Data>,
): Promise<Data> {
  // jangan biarkan caller overwrite _id / canal_data lewat patch root.
  const { _id, canal_data, ...safe } = patch;
  void _id;
  void canal_data;
  const updated = await dataModel().findByIdAndUpdate(rootId, { $set: safe }, { new: true })
    .lean<Data>()
    .exec();
  if (!updated) throw new HttpError(`MainData ${rootId} tidak ditemukan`, 404);
  return updated;
}

/** PATCH /data/:id — update field 1 segmen (positional `$`). */
export async function updateSegment(
  segmentId: string,
  patch: Partial<CanalDataSegment>,
): Promise<Data> {
  const { _id, data, ...safe } = patch;
  void _id;
  void data;
  const updated = await dataModel().findOneAndUpdate(
    { 'canal_data._id': segmentId },
    { $set: segmentSet(safe) },
    { new: true },
  )
    .lean<Data>()
    .exec();
  if (!updated)
    throw new HttpError(`Segmen ${segmentId} tidak ditemukan`, 404);
  return updated;
}

/**
 * PATCH /detaildata/:id — update 1 titik kedalaman pakai arrayFilters.
 * `:id` = data._id. Kita target nested deep via filter `seg`/`pt`.
 */
export async function updatePoint(
  pointId: string,
  patch: Partial<DepthPoint>,
): Promise<Data> {
  const { _id, ...safe } = patch;
  void _id;
  const updated = await dataModel().findOneAndUpdate(
    { 'canal_data.data._id': pointId },
    { $set: pointSet(safe) },
    {
      new: true,
      arrayFilters: pointFiltersById(pointId),
    },
  )
    .lean<Data>()
    .exec();
  if (!updated)
    throw new HttpError(`Titik kedalaman ${pointId} tidak ditemukan`, 404);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CHART (port: PATCH /updatechartdata/:id) — REVERSE DRAG FORMULA
// ─────────────────────────────────────────────────────────────────────────────

/** 1 titik hasil drag dari FE (chart) — displayed depth, bukan raw. */
export interface DraggedPoint {
  /** _id titik kedalaman ATAU sta sebagai fallback identifikasi. */
  pointId?: string;
  sta?: number;
  /** nilai displayed (negatif, sudah * -1) hasil drag user di chart. */
  displayed: number;
}

/**
 * PATCH /updatechartdata/:id — terima titik-titik hasil drag (displayed depth),
 * REVERSE ke raw depth pakai parameter segmen, lalu simpan ke DB.
 *
 * `:id` = canal_data._id (segmen yg di-drag). Reverse formula (DOMAIN.md poin 4):
 *   raw_depth = displayed - (WL + tranducer + bed_float - depth_correction)
 * (finalDepth & reverseDepth sinkron FE drag + BE — JANGAN ubah salah satu saja).
 */
export async function updateChartData(
  segmentId: string,
  dragged: DraggedPoint[],
): Promise<Data> {
  const r = await resolveId(segmentId);
  if (!r || r.level !== 'segment' || !r.segment) {
    throw new HttpError(`id ${segmentId} bukan segmen canal_data`, 400);
  }
  const p = segParams(r.segment);
  const params = {
    water_level: p.waterLevel,
    tranducer: p.tranducer,
    bed_float: p.bedFloat,
    depth_correction: p.depthCorrection,
  };

  // Petakan tiap drag → titik tujuan (by _id, fallback by sta) → raw depth baru.
  const ops: Array<{ matchSta: number | null; matchId: string | null; raw: number }> =
    dragged.map((d) => ({
      matchId: d.pointId ?? null,
      matchSta: d.sta ?? null,
      raw: reverseDepth(d.displayed, params),
    }));

  // Update per-titik dgn arrayFilters (atomic, tanpa load-save seluruh dokumen).
  for (const op of ops) {
    if (op.matchId) {
      await dataModel().updateOne(
        { 'canal_data.data._id': op.matchId },
        { $set: pointSet({ depth: op.raw }) },
        { arrayFilters: pointFiltersById(op.matchId) },
      ).exec();
    } else if (op.matchSta != null) {
      await dataModel().updateOne(
        { 'canal_data._id': segmentId },
        { $set: pointSet({ depth: op.raw }) },
        { arrayFilters: pointFiltersBySta(segmentId, op.matchSta) },
      ).exec();
    }
  }

  const updated = await dataModel().findById(r.root._id).lean<Data>().exec();
  if (!updated) throw new HttpError('MainData hilang setelah update', 500);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (port: semua DELETE variants)
// ─────────────────────────────────────────────────────────────────────────────

/** DELETE /alldatas — hapus seluruh koleksi Data. */
export async function deleteAllData(): Promise<number> {
  const res = await dataModel().deleteMany({}).exec();
  return res.deletedCount ?? 0;
}

/** DELETE /datas/:id — hapus 1 root MainData. */
export async function deleteMainData(rootId: string): Promise<void> {
  const res = await dataModel().findByIdAndDelete(rootId).exec();
  if (!res) throw new HttpError(`MainData ${rootId} tidak ditemukan`, 404);
}

/**
 * DELETE /alldata/:id — kosongkan SEMUA segmen canal_data di root `:id`.
 * (port existing: hapus semua canal_data tapi keep dokumen root.)
 */
export async function deleteAllSegments(rootId: string): Promise<Data> {
  const updated = await dataModel().findByIdAndUpdate(
    rootId,
    { $set: { canal_data: [] } },
    { new: true },
  )
    .lean<Data>()
    .exec();
  if (!updated) throw new HttpError(`MainData ${rootId} tidak ditemukan`, 404);
  return updated;
}

/** DELETE /data/:id — hapus 1 segmen canal_data (pull by _id). */
export async function deleteSegment(segmentId: string): Promise<Data> {
  const updated = await dataModel().findOneAndUpdate(
    { 'canal_data._id': segmentId },
    { $pull: { canal_data: { _id: segmentId } } },
    { new: true },
  )
    .lean<Data>()
    .exec();
  if (!updated)
    throw new HttpError(`Segmen ${segmentId} tidak ditemukan`, 404);
  return updated;
}

/**
 * DELETE /alldetaildata/:id — kosongkan semua titik kedalaman di segmen `:id`.
 * `:id` = canal_data._id (positional `$`).
 */
export async function deleteAllPoints(segmentId: string): Promise<Data> {
  const updated = await dataModel().findOneAndUpdate(
    { 'canal_data._id': segmentId },
    { $set: { 'canal_data.$.data': [] } },
    { new: true },
  )
    .lean<Data>()
    .exec();
  if (!updated)
    throw new HttpError(`Segmen ${segmentId} tidak ditemukan`, 404);
  return updated;
}

/**
 * DELETE /detaildata/:id — hapus 1 titik kedalaman (pull by data._id via arrayFilters).
 * `:id` = data._id.
 */
export async function deletePoint(pointId: string): Promise<Data> {
  const updated = await dataModel().findOneAndUpdate(
    { 'canal_data.data._id': pointId },
    { $pull: { 'canal_data.$[seg].data': { _id: pointId } } },
    { new: true, arrayFilters: [{ 'seg.data._id': pointId }] },
  )
    .lean<Data>()
    .exec();
  if (!updated)
    throw new HttpError(`Titik kedalaman ${pointId} tidak ditemukan`, 404);
  return updated;
}
