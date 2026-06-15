/**
 * qc.list — query daftar output QC untuk grid FE (QcProcessing /qc).
 *
 * FE menampilkan kartu per canal yang sudah/akan di-export: filename output, status,
 * sumber (order no + canalId), mini chart (displayed depths), dan ringkasan pass/tol/
 * fail. Endpoint ini meng-agregat Canal yang punya dataId (siap export) + memproyeksi
 * depths ringan untuk mini chart, tanpa render PNG.
 *
 * Scope: operator → canal miliknya (assignedTo); admin → semua. Decoupled model
 * by-name (sama pola context).
 */
import mongoose, { type Model } from 'mongoose';
import type { Canal, Data, Threshold } from '../../shared/types.js';
import { finalDepth } from '../../shared/domain/depth.js';
import { classifyThreshold } from '../../shared/domain/threshold.js';
import { shortName as shortNameFallback } from '../../shared/domain/shortName.js';
import { buildFileName } from '../../shared/domain/fileName.js';

function m<T>(name: string): Model<T> {
  const model = mongoose.models[name] as Model<T> | undefined;
  if (!model) throw new Error(`Model '${name}' belum teregistrasi`);
  return model;
}

/** 1 kartu output untuk grid FE. */
export interface QcOutputCard {
  canalId: string; // Canal _id
  canalCode: string; // canalId string ("SB180202")
  orderNo: string;
  contractorShort: string;
  district: string;
  status: Canal['status'];
  qcOutput: string | null;
  requestType: Canal['requestType'];
  /** displayed depths (negatif) untuk mini bar chart. */
  mini: number[];
  summary: { pass: number; tol: number; fail: number; total: number };
}

async function loadThreshold(): Promise<Threshold | null> {
  const p = await m<{
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

export interface ListScope {
  role: 'admin' | 'operator';
  userId: string;
}

/** Daftar kartu output QC untuk grid FE. */
export async function listQcOutputs(scope: ListScope): Promise<QcOutputCard[]> {
  const filter: Record<string, unknown> = { dataId: { $ne: null } };
  if (scope.role !== 'admin') filter.assignedTo = scope.userId;

  const [canals, threshold] = await Promise.all([
    m<Canal>('Canal').find(filter).sort({ updatedAt: -1 }).limit(60).lean<Canal[]>().exec(),
    loadThreshold(),
  ]);

  const cards: QcOutputCard[] = [];
  for (const canal of canals) {
    const dataDoc = canal.dataId
      ? await m<Data>('Data').findById(canal.dataId).lean<Data>().exec()
      : null;
    const seg =
      dataDoc?.canal_data.find((c) => c.canal_id === canal.canalId) ??
      dataDoc?.canal_data[0] ??
      null;

    let pass = 0;
    let tol = 0;
    let fail = 0;
    const mini: number[] = [];
    if (seg) {
      const params = {
        water_level: Number(seg.water_level) || 0,
        tranducer: Number(seg.tranducer) || 0,
        bed_float: Number(seg.bed_float) || 0,
        depth_correction: Number(seg.depth_correction) || 0,
      };
      for (const d of seg.data) {
        const displayed = finalDepth({ depth: Number(d.depth) || 0, ...params });
        mini.push(Number(displayed.toFixed(3)));
        if (threshold) {
          const k = classifyThreshold(Math.abs(displayed), threshold);
          if (k === 'pass') pass++;
          else if (k === 'tolerance') tol++;
          else fail++;
        }
      }
    }

    // Tampilkan qcOutput tersimpan; kalau belum ada, preview filename dasar.
    const previewName =
      canal.qcOutput ??
      buildFileName({
        districtCode: canal.district.slice(0, 4).toUpperCase(),
        qcDate: new Date(seg?.qc_date || canal.requestDate),
        usv: canal.usv ?? 'KBN01',
        urut: 1,
        revision: 0,
        requestType: canal.requestType,
      });

    cards.push({
      canalId: String(canal._id),
      canalCode: canal.canalId,
      orderNo: canal.orderNo,
      contractorShort: shortNameFallback(canal.contractor),
      district: canal.district,
      status: canal.status,
      // qcOutput nyata kalau sudah Done; kalau belum, preview nama dasar.
      qcOutput: canal.qcOutput ?? previewName,
      requestType: canal.requestType,
      mini,
      summary: { pass, tol, fail, total: mini.length },
    });
  }
  return cards;
}
