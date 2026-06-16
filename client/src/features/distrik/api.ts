/**
 * API client slice `distrik` — manajemen master distrik & region (admin-only).
 * Bungkus transport ke BE `/districts/*` (slice [district] server). Server membungkus
 * respons sukses dalam `{ data: ... }`.
 *
 * Reuse axios instance dari slice [auth] (`apiClient`) supaya interceptor
 * 401→app-lock konsisten (spec § C). JANGAN bikin instance baru.
 *
 * Catatan kontrak server (BUKAN konvensi users): field server pakai
 * `districtName`/`districtId` (BUKAN name/kode), update lewat PUT (BUKAN PATCH),
 * dan DELETE polymorphic (`/districts/:id?`). Tipe `Distrik` di sini meng-expose
 * label UI casual (`name`/`kode`) tapi mapping ke field server dilakukan di sini.
 */
import { apiClient } from '../auth/api.js';
import type { Id } from '../../shared/types.js';

/** Bentuk distrik yang dikembalikan server (field legacy + extend). */
export interface Distrik {
  /** ObjectId Mongo (string). Server mengembalikan `_id`. */
  id: Id;
  /** Nama distrik, mis. "Banyuasin" / "D.SUNGAI_BEYUKU". */
  name: string;
  /** Kode 4-char untuk output filename QC, mis. "3C01". */
  kode: string;
  /** Region grouping (nama kontraktor/area), null kalau belum di-set. */
  regionName: string | null;
  /** Link ke Contractor (ObjectId string) atau null. */
  contractorId: Id | null;
}

/** Payload form: label UI casual. */
export interface DistrikFormValues {
  name: string;
  kode: string;
  regionName: string;
  contractorId: string;
}

/** Body wire untuk BE (field server: districtName/districtId). */
interface DistrictWireBody {
  districtName?: string;
  districtId?: string;
  regionName?: string | null;
  contractorId?: string | null;
}

/** Bentuk mentah dari server (collection legacy `districts`). */
interface DistrictWire {
  _id: string;
  districtName: string;
  districtId: string;
  regionName: string | null;
  contractorId: string | null;
}

/** Map dokumen server → bentuk UI casual. */
function fromWire(d: DistrictWire): Distrik {
  return {
    id: d._id,
    name: d.districtName,
    kode: d.districtId,
    regionName: d.regionName ?? null,
    contractorId: d.contractorId ?? null,
  };
}

/** Map form UI casual → body wire server. `contractorId` kosong → null. */
function toWire(v: DistrikFormValues): DistrictWireBody {
  return {
    districtName: v.name,
    districtId: v.kode,
    regionName: v.regionName.trim() || null,
    contractorId: v.contractorId.trim() || null,
  };
}

/** GET /districts → daftar semua distrik (server sort by districtName). */
export async function listDistricts(): Promise<Distrik[]> {
  const { data } = await apiClient.get<{ data: DistrictWire[] }>('/districts');
  return data.data.map(fromWire);
}

/** POST /districts → buat distrik baru. */
export async function createDistrict(values: DistrikFormValues): Promise<Distrik> {
  const { data } = await apiClient.post<{ data: DistrictWire }>('/districts', toWire(values));
  return fromWire(data.data);
}

/** PUT /districts/:id → update distrik (server menerima partial). */
export async function updateDistrict(id: Id, values: DistrikFormValues): Promise<Distrik> {
  const { data } = await apiClient.put<{ data: DistrictWire }>(`/districts/${id}`, toWire(values));
  return fromWire(data.data);
}

/** DELETE /districts/:id → hapus satu distrik. */
export async function deleteDistrict(id: Id): Promise<void> {
  await apiClient.delete(`/districts/${id}`);
}
