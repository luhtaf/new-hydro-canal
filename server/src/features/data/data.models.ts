/**
 * Akses model untuk slice data — DECOUPLED dari slice [shared-models].
 *
 * Kenapa tidak `import { DataModel } from '../../shared/models'`?
 * Slice shared-models dibangun PARALEL; barrel-nya bisa belum meng-export saat slice
 * ini dikompilasi. Untuk menghormati boundary (model = milik shared-models, BUKAN
 * milik data) tapi tetap typecheck mandiri (TS strict), kita ambil model lewat
 * `mongoose.model(name)` by registered name saat runtime. shared-models yang
 * MEN-DEFINISIKAN schema-nya (`new Schema(...)`) + `mongoose.model('Data', …)`.
 *
 * Kontrak nama model (sinkron dgn shared-models):
 *   - 'Data'         → koleksi `datas`     (nested: Data > canal_data[] > data[])
 *   - 'Pengukuran'   → koleksi `pengukurans` (singleton threshold, DOMAIN.md poin 5)
 *
 * Jika shared-models akhirnya meng-export Model langsung dari barrel, ganti dua
 * getter di bawah dgn re-export dari '../../shared/models/index.js' — perilaku sama.
 */
import mongoose, { type Model } from 'mongoose';
import type { Data, Pengukuran } from '../../shared/types.js';

/** Tipe dokumen lean (plain object) — slice ini hanya butuh shape data, bukan methods. */
type DataDoc = Data;
type ThresholdDoc = Pengukuran;

/**
 * Ambil model 'Data' yang sudah diregistrasi shared-models. Lempar jelas kalau
 * belum teregistrasi (bukan crash kriptik mongoose) → memudahkan diagnosa boot order.
 */
export function dataModel(): Model<DataDoc> {
  const m = mongoose.models.Data as Model<DataDoc> | undefined;
  if (!m) {
    throw new Error(
      "Model 'Data' belum teregistrasi — pastikan slice shared-models di-import sebelum route data dipakai.",
    );
  }
  return m;
}

/** Ambil model singleton threshold 'Pengukuran'. */
export function thresholdModel(): Model<ThresholdDoc> {
  const m = mongoose.models.Pengukuran as Model<ThresholdDoc> | undefined;
  if (!m) {
    throw new Error(
      "Model 'Pengukuran' belum teregistrasi — pastikan slice shared-models di-import lebih dulu.",
    );
  }
  return m;
}
