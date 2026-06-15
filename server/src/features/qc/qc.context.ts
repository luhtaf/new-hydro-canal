/**
 * qc.context — loader konteks export untuk 1 canal.
 *
 * Semua exporter (PNG/TXT/Excel/PAT/ZPM32) butuh data yang sama: dokumen Canal
 * (1 row AOI), segmen Data yang cocok (canal_data dengan canal_id sama), operator
 * (User), threshold (Pengukuran singleton), kode distrik 4-char (District), dan
 * singkatan kontraktor. Loader ini merangkainya sekali → dipakai ulang.
 *
 * Akses model lewat `mongoose.models.X` by-name (sama pola data.models.ts) supaya
 * slice ini decoupled dari urutan import shared-models (guardrail #1). Kontrak nama
 * model: 'Canal' / 'Data' / 'User' / 'Pengukuran' / 'District' / 'Contractor'.
 */
import mongoose, { type Model } from 'mongoose';
import type {
  Canal,
  CanalDataSegment,
  Data,
  Threshold,
  User,
  Contractor,
  District,
} from '../../shared/types.js';
import { finalDepth } from '../../shared/domain/depth.js';
import { classifyThreshold } from '../../shared/domain/threshold.js';
import type { ThresholdClass } from '../../shared/types.js';
import { shortName as shortNameFallback } from '../../shared/domain/shortName.js';
import { HttpError } from '../data/data.service.js';

function modelByName<T>(name: string): Model<T> {
  const m = mongoose.models[name] as Model<T> | undefined;
  if (!m) {
    throw new HttpError(
      `Model '${name}' belum teregistrasi — pastikan shared-models di-import sebelum slice qc dipakai.`,
      500,
    );
  }
  return m;
}

/** 1 titik kedalaman siap-export (raw + displayed + klasifikasi). */
export interface QcPoint {
  sta: number;
  rawDepth: number;
  displayed: number;
  klass: ThresholdClass | null;
  lat: number;
  lng: number;
  /** koordinat UTM (per-titik bila ada; fallback koordinat canal). */
  coordX: number;
  coordY: number;
  time: string;
}

export interface QcContext {
  canal: Canal;
  segment: CanalDataSegment;
  operator: User | null;
  threshold: Threshold | null;
  districtCode: string;
  contractorShort: string;
  points: QcPoint[];
  /** ringkasan jumlah pass/tol/fail. */
  summary: { pass: number; tol: number; fail: number; total: number };
}

/** Ambil threshold singleton (Pengukurans) → bentuk flat Threshold. */
async function loadThreshold(): Promise<Threshold | null> {
  const p = await modelByName<{
    lulus: number;
    tidakLulus: number;
    toleransi: { batasAwal: number; batasAkhir: number };
  }>('Pengukuran')
    .findOne()
    .lean()
    .exec();
  if (!p) return null;
  return {
    lulus: p.lulus,
    tidakLulus: p.tidakLulus,
    batasAwal: p.toleransi.batasAwal,
    batasAkhir: p.toleransi.batasAkhir,
  };
}

function segParams(seg: CanalDataSegment) {
  return {
    water_level: Number(seg.water_level) || 0,
    tranducer: Number(seg.tranducer) || 0,
    bed_float: Number(seg.bed_float) || 0,
    depth_correction: Number(seg.depth_correction) || 0,
  };
}

/**
 * Resolve konteks export untuk 1 canal.
 * `canalId` = Canal `_id` (dokumen AOI), BUKAN canalId string / Data segment id.
 */
export async function loadQcContext(canalId: string): Promise<QcContext> {
  const canal = await modelByName<Canal>('Canal').findById(canalId).lean<Canal>().exec();
  if (!canal) throw new HttpError(`Canal ${canalId} tidak ditemukan`, 404);
  if (!canal.dataId) {
    throw new HttpError(
      `Canal ${canal.canalId} belum punya data pengukuran (dataId kosong) — input dulu sebelum export`,
      409,
    );
  }

  const dataDoc = await modelByName<Data>('Data')
    .findById(canal.dataId)
    .lean<Data>()
    .exec();
  if (!dataDoc) throw new HttpError(`Data ${canal.dataId} tidak ditemukan`, 404);

  // Segmen yang cocok: canal_id sama dgn Canal.canalId; fallback segmen pertama.
  const segment =
    dataDoc.canal_data.find((c) => c.canal_id === canal.canalId) ?? dataDoc.canal_data[0];
  if (!segment) {
    throw new HttpError(`Data ${canal.dataId} tidak punya segmen canal_data`, 409);
  }

  const [operator, threshold] = await Promise.all([
    canal.assignedTo
      ? modelByName<User>('User').findById(canal.assignedTo).lean<User>().exec()
      : Promise.resolve(null),
    loadThreshold(),
  ]);

  // Kode distrik 4-char untuk filename (DOMAIN.md poin 7).
  const district = await modelByName<District>('District')
    .findOne({ districtName: canal.district })
    .lean<District>()
    .exec();
  const districtCode = district?.districtId || canal.district.slice(0, 4).toUpperCase();

  // Singkatan kontraktor: prefer collection contractors, fallback mapping domain.
  const contractorDoc = await modelByName<Contractor>('Contractor')
    .findOne({ fullName: canal.contractor })
    .lean<Contractor>()
    .exec();
  const contractorShort = contractorDoc?.shortName || shortNameFallback(canal.contractor);

  const p = segParams(segment);
  let pass = 0;
  let tol = 0;
  let fail = 0;
  const points: QcPoint[] = segment.data.map((d) => {
    const rawDepth = Number(d.depth) || 0;
    const displayed = finalDepth({ depth: rawDepth, ...p });
    const klass = threshold ? classifyThreshold(Math.abs(displayed), threshold) : null;
    if (klass === 'pass') pass++;
    else if (klass === 'tolerance') tol++;
    else if (klass === 'fail') fail++;
    return {
      sta: d.sta,
      rawDepth,
      displayed,
      klass,
      lat: Number(d.lattitude) || 0,
      lng: Number(d.longitude) || 0,
      coordX: segment.coord_x ?? canal.coordX,
      coordY: segment.coord_y ?? canal.coordY,
      time: d.time ?? '',
    };
  });

  return {
    canal,
    segment,
    operator,
    threshold,
    districtCode,
    contractorShort,
    points,
    summary: { pass, tol, fail, total: points.length },
  };
}
