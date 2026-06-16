/**
 * Service District — logika CRUD murni (tanpa Express). Dipakai controller + bisa
 * dipanggil fitur lain kalau perlu (mis. qc lookup kode). Model dari shared/models.
 */
import { Types } from 'mongoose';
import { District, type DistrictDoc } from '../../shared/models/District.js';

export interface DistrictInput {
  districtName: string;
  districtId: string;
  /** BARU — extend body (PLAN-BE.md "District PORT + extend"). */
  regionName?: string | null;
  /** BARU — link ke Contractor (ObjectId string) atau null. */
  contractorId?: string | null;
}

/** Normalisasi contractorId string → ObjectId | null. Throw kalau format salah. */
function toContractorId(raw: string | null | undefined): Types.ObjectId | null {
  if (raw == null || raw === '') return null;
  if (!Types.ObjectId.isValid(raw)) {
    const err = new Error('contractorId bukan ObjectId valid') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  return new Types.ObjectId(raw);
}

export async function listDistricts(): Promise<DistrictDoc[]> {
  return District.find().sort({ districtName: 1 }).lean<DistrictDoc[]>().exec();
}

export async function createDistrict(input: DistrictInput): Promise<DistrictDoc> {
  const doc = await District.create({
    districtName: input.districtName.trim(),
    districtId: input.districtId.trim(),
    regionName: input.regionName?.trim() || null,
    contractorId: toContractorId(input.contractorId),
  });
  return doc.toObject() as DistrictDoc;
}

/** Update penuh (PUT). Hanya field yang dikirim yang di-set. */
export async function updateDistrict(
  id: string,
  input: Partial<DistrictInput>,
): Promise<DistrictDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  const set: Record<string, unknown> = {};
  if (input.districtName !== undefined) set.districtName = input.districtName.trim();
  if (input.districtId !== undefined) set.districtId = input.districtId.trim();
  if (input.regionName !== undefined) set.regionName = input.regionName?.trim() || null;
  if (input.contractorId !== undefined) set.contractorId = toContractorId(input.contractorId);

  return District.findByIdAndUpdate(id, { $set: set }, { new: true })
    .lean<DistrictDoc>()
    .exec();
}

/** Hapus 1 distrik (kalau id ada) atau SEMUA (kalau id undefined — port pola lama). */
export async function deleteDistrict(id?: string): Promise<{ deleted: number }> {
  if (id === undefined) {
    const res = await District.deleteMany({}).exec();
    return { deleted: res.deletedCount ?? 0 };
  }
  if (!Types.ObjectId.isValid(id)) return { deleted: 0 };
  const res = await District.deleteOne({ _id: id }).exec();
  return { deleted: res.deletedCount ?? 0 };
}
