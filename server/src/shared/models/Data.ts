/**
 * Model `Data` (collection legacy `datas`) — PORT PERSIS dari app lama, extend (bukan replace).
 *
 * Nested deep: Data > canal_data[] > data[]. Backward compatible: field BARU
 * (measure_date, region, coord_x, coord_y) ditambah sebagai optional, default tidak
 * memaksa migrasi data lama.
 *
 * Ejaan legacy `lattitude` & `tranducer` SENGAJA dipertahankan supaya cocok dengan
 * dokumen lama di Mongo (jangan dikoreksi — itu breaking).
 *
 * Acuan: PLAN-BE.md "Data (models/DataModel.js existing)"; shared/types.ts (Data, CanalDataSegment, DepthPoint).
 */
import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** 1 titik kedalaman di sepanjang STA. */
const depthPointSchema = new Schema(
  {
    lattitude: { type: Number, required: true }, // sic — ejaan legacy
    longitude: { type: Number, required: true },
    time: { type: String, default: '' },
    depth: { type: Number, required: true },
    sta: { type: Number, required: true },
    sta_distance: { type: Number, default: 0 },
  },
  { _id: true },
);

const dimensiSchema = new Schema(
  {
    panjang: { type: Number, default: 0 },
    lebar: { type: Number, default: 0 },
    tinggi: { type: Number, default: 0 },
  },
  { _id: false },
);

const districtEmbedSchema = new Schema(
  {
    name: { type: String, default: '' },
    code: { type: String, default: '' },
  },
  { _id: false },
);

/** 1 segmen canal (canal_data[]). */
const canalDataSegmentSchema = new Schema(
  {
    canal_id: { type: String, required: true },
    dimensi: { type: dimensiSchema, default: () => ({}) },
    order_no: { type: String, default: '' },
    operation_no: { type: String, default: '0010' },
    start: { type: String, default: '' },
    end: { type: String, default: '' },
    measure_point: { type: String, default: '' },
    water_level: { type: String, default: '0' },
    depth_correction: { type: String, default: '0' },
    bed_float: { type: String, default: '0' },
    revision: { type: String, default: '001' },
    qc_type: { type: String, default: 'QC' },
    operator: { type: String, default: '' },
    qc_date: { type: String, default: '' },
    measure_date: { type: String, default: '' }, // BARU
    usv_code: { type: String, default: '' },
    district: { type: districtEmbedSchema, default: () => ({}) },
    region: { type: String, default: undefined }, // BARU (optional)
    canal_upper_width: { type: Number, default: 0 },
    canal_bottom_width: { type: Number, default: 0 },
    canal_length: { type: Number, default: 0 },
    tranducer: { type: Number, default: 0 }, // sic — ejaan legacy
    lane: { type: Number, default: 0 },
    content_name: { type: String, default: '' },
    coord_x: { type: Number, default: undefined }, // BARU (UTM Easting)
    coord_y: { type: Number, default: undefined }, // BARU (UTM Northing)
    data: { type: [depthPointSchema], default: [] },
  },
  { _id: true },
);

const dataSchema = new Schema(
  {
    batang_canal_id: { type: String, required: true, index: true },
    canal_data: { type: [canalDataSegmentSchema], default: [] },
  },
  {
    collection: 'datas', // nama collection legacy (lowercase plural mongoose default)
    minimize: false,
  },
);

export type DataDoc = InferSchemaType<typeof dataSchema>;

// Hindari OverwriteModelError saat hot-reload / multi-import di test.
export const Data: Model<DataDoc> =
  (mongoose.models.Data as Model<DataDoc>) ?? model<DataDoc>('Data', dataSchema);
