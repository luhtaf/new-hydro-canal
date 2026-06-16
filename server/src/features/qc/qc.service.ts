/**
 * qc.service — orkestrasi export QC per format + side-effect "selesai".
 *
 * Tiap export single-format memuat QcContext (qc.context) lalu memanggil exporter
 * yang sesuai. Saat export SUKSES, status Canal → 'Done' & qcOutput diisi nama file
 * dasar (DOMAIN.md poin 7) — handoff ke [penugasan]/[undangan] yang menampilkan
 * qcOutput. Status & qcOutput = admin-field → server-wins di [sync].
 *
 * Bulk: gabungkan beberapa canal × beberapa format jadi 1 ZIP (archiver). archiver
 * BELUM ada di package.json → dicatat di missingDeps; di-import dinamis supaya modul
 * tetap kompilasi & error jelas kalau dep belum terpasang.
 *
 * Render PNG (chartjs-node-canvas) di chart/renderPng. Filename via qc.filename.
 */
import mongoose, { type Model } from 'mongoose';
import { Readable } from 'node:stream';
import type { Canal } from '../../shared/types.js';
import { HttpError } from '../data/data.service.js';
import { loadQcContext, type QcContext } from './qc.context.js';
import { buildQcFileName } from './qc.filename.js';
import { renderQcPng } from './chart/renderPng.js';
import { exportTxt } from './exporters/txt.js';
import { exportPage2Xlsx, exportPage3Xlsx } from './exporters/xlsx.js';
import { exportPatCsv } from './exporters/patCsv.js';
import { exportZpm32 } from './exporters/zpm32.js';

/** Format export yang didukung (sinkron dgn FE qc.api). */
export type ExportFormat = 'png' | 'txt' | 'page2-xlsx' | 'page3-xlsx' | 'pat-csv' | 'zpm32';

export const EXPORT_FORMATS: ExportFormat[] = [
  'png',
  'txt',
  'page2-xlsx',
  'page3-xlsx',
  'pat-csv',
  'zpm32',
];

/** Hasil 1 export single-format siap di-stream. */
export interface ExportResult {
  filename: string;
  mime: string;
  body: Buffer;
}

function canalModel(): Model<Canal> {
  const m = mongoose.models.Canal as Model<Canal> | undefined;
  if (!m) throw new HttpError("Model 'Canal' belum teregistrasi", 500);
  return m;
}

/**
 * Tandai canal selesai: status → Done + qcOutput = nama file dasar.
 * Idempotent: dipanggil tiap export sukses; qcOutput selalu di-refresh ke base terbaru.
 */
async function markDone(ctx: QcContext): Promise<void> {
  const base = buildQcFileName(ctx).base;
  await canalModel()
    .updateOne(
      { _id: ctx.canal._id },
      { $set: { status: 'Done', qcOutput: base } },
    )
    .exec();
}

/** Generate 1 file untuk format tertentu dari context yang sudah dimuat. */
async function generate(ctx: QcContext, format: ExportFormat, urut = 1): Promise<ExportResult> {
  switch (format) {
    case 'png': {
      const body = await renderQcPng(ctx);
      return { filename: `${buildQcFileName(ctx, urut).base}.png`, mime: 'image/png', body };
    }
    case 'txt': {
      const { filename, content } = exportTxt(ctx, urut);
      return { filename, mime: 'text/plain; charset=utf-8', body: Buffer.from(content, 'utf-8') };
    }
    case 'page2-xlsx': {
      const { filename, buffer } = exportPage2Xlsx(ctx, urut);
      return {
        filename,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: buffer,
      };
    }
    case 'page3-xlsx': {
      const { filename, buffer } = exportPage3Xlsx(ctx, urut);
      return {
        filename,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: buffer,
      };
    }
    case 'pat-csv': {
      const { filename, content } = exportPatCsv(ctx, urut);
      return { filename, mime: 'text/csv; charset=utf-8', body: Buffer.from(content, 'utf-8') };
    }
    case 'zpm32': {
      const { filename, buffer } = exportZpm32(ctx, urut);
      return {
        filename,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: buffer,
      };
    }
    default:
      throw new HttpError(`Format export '${format}' tidak dikenal`, 400);
  }
}

/**
 * Export single-format untuk 1 canal. Saat sukses → markDone (status Done + qcOutput).
 * `canalId` = Canal `_id`.
 */
export async function exportSingle(canalId: string, format: ExportFormat): Promise<ExportResult> {
  const ctx = await loadQcContext(canalId);
  const result = await generate(ctx, format);
  await markDone(ctx);
  return result;
}

/**
 * Export bulk: untuk tiap canal × tiap format hasilkan file, bungkus ZIP (archiver).
 * Return Readable stream ZIP + nama file. markDone dipanggil per canal yang sukses.
 *
 * archiver di-import dinamis (belum di deps → missingDeps). Kalau belum terpasang,
 * lempar HttpError jelas, bukan crash kriptik.
 */
export async function exportBulk(
  canalIds: string[],
  formats: ExportFormat[],
): Promise<{ filename: string; stream: Readable }> {
  if (canalIds.length === 0) throw new HttpError('canalIds kosong', 400);
  if (formats.length === 0) throw new HttpError('formats kosong', 400);

  // archiver belum di deps (missingDeps) → import dinamis by-spec string supaya TS
  // tidak butuh @types/archiver saat kompilasi. Minimal shape yang dipakai di-anotasi.
  interface ArchiverLike {
    append(source: Buffer | string, opts: { name: string }): void;
    finalize(): Promise<void>;
    pipe(dest: NodeJS.WritableStream): unknown;
    on(event: string, cb: (...args: unknown[]) => void): unknown;
    emit(event: string, ...args: unknown[]): unknown;
  }
  type ArchiverFactory = (
    format: string,
    opts?: { zlib?: { level?: number } },
  ) => ArchiverLike;

  let archiver: ArchiverFactory;
  try {
    const spec = 'archiver';
    const mod = (await import(/* @vite-ignore */ spec)) as { default: ArchiverFactory };
    archiver = mod.default;
  } catch {
    throw new HttpError(
      "Dependency 'archiver' belum terpasang — jalankan npm i archiver (lihat missingDeps).",
      501,
    );
  }

  const archive = archiver('zip', { zlib: { level: 9 } });

  // Isi archive secara async; error archive di-propagate ke stream consumer.
  (async () => {
    for (const id of canalIds) {
      try {
        const ctx = await loadQcContext(id);
        for (const fmt of formats) {
          const res = await generate(ctx, fmt);
          archive.append(res.body, { name: res.filename });
        }
        await markDone(ctx);
      } catch (err) {
        // Tulis catatan error per canal ke dalam ZIP, jangan gagalkan keseluruhan.
        const msg = err instanceof Error ? err.message : String(err);
        archive.append(`Gagal export canal ${id}: ${msg}\n`, { name: `_errors/${id}.txt` });
      }
    }
    await archive.finalize();
  })().catch((err) => archive.emit('error', err));

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // archive instance adalah Readable stream (archiver extend stream.Transform).
  return { filename: `qc-export-${stamp}.zip`, stream: archive as unknown as Readable };
}
