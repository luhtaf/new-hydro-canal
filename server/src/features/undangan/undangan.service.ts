/**
 * Service slice [undangan] — ingestion AOI + query Aoi/Canal.
 *
 * Owner ingestion AOI: parse Excel → buat 1 Aoi (header) + N Canal (1 row = 1 Canal,
 * DOMAIN CRITICAL Order No per canal). Canal/Aoi adalah model SHARED (shared/models);
 * slice ini OWNER tulis-nya saat import + READER untuk list/detail/filter.
 *
 * Audit "import" + notif admin = side-effect import (best-effort, tak menggagalkan import).
 */
import mongoose from 'mongoose';
import {
  Aoi,
  Canal,
  AuditLog,
  Notification,
  UserModel,
  type CanalDoc,
} from '../../shared/models/index.js';
import type { Aoi as AoiDto, Canal as CanalDto, CanalStatus } from '../../shared/types.js';
import { parseAoiExcel, type ParseResult, type RowError } from './aoiParser.js';

// ─────────────────────────────────────────────────────────────────────────────
// Mapper doc → DTO (wire selalu string id + ISO date)
// ─────────────────────────────────────────────────────────────────────────────

function iso(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString() : '';
}

function canalToDto(c: CanalDoc): CanalDto {
  return {
    _id: String(c._id),
    aoiId: String(c.aoiId),
    district: c.district,
    orderNo: c.orderNo,
    requestDate: iso(c.requestDate),
    requestType: c.requestType as CanalDto['requestType'],
    canalId: c.canalId,
    panjang: c.panjang,
    dimensi: c.dimensi ?? '',
    measurePoint: c.measurePoint ?? '',
    startDate: iso(c.startDate),
    finishDate: iso(c.finishDate),
    contractor: c.contractor,
    coordX: c.coordX,
    coordY: c.coordY,
    status: c.status as CanalStatus,
    assignedTo: c.assignedTo ? String(c.assignedTo) : null,
    assignedAt: c.assignedAt ? iso(c.assignedAt) : null,
    usv: (c.usv ?? null) as CanalDto['usv'],
    qcOutput: c.qcOutput ?? null,
    dataId: c.dataId ? String(c.dataId) : null,
    createdAt: iso((c as unknown as { createdAt?: Date }).createdAt),
    updatedAt: iso((c as unknown as { updatedAt?: Date }).updatedAt),
  };
}

function aoiToDto(a: {
  _id: unknown;
  region: string;
  area: string;
  vendor: string;
  notificationTitle?: string;
  importedAt?: Date;
  importedBy: unknown;
  canalCount?: number;
  sourceFile?: string;
}): AoiDto {
  return {
    _id: String(a._id),
    region: a.region,
    area: a.area,
    vendor: a.vendor,
    notificationTitle: a.notificationTitle ?? 'AOI QC Canal USV Notification',
    importedAt: iso(a.importedAt),
    importedBy: String(a.importedBy),
    canalCount: a.canalCount ?? 0,
    sourceFile: a.sourceFile,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Import AOI (POST /aoi/import)
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportResult {
  aoiId: string;
  canalCount: number;
  /** baris yang gagal validasi (tidak di-persist). */
  errors: RowError[];
  /** orderNo yang dilewati karena sudah ada (unique orderNo). */
  duplicates: string[];
}

export interface ImportActor {
  id: string;
  name: string;
  initials: string;
}

/**
 * Parse + persist 1 file Excel AOI. Baris invalid dilewati (dilaporkan di `errors`),
 * orderNo yang sudah ada (unique) dilewati (`duplicates`). Audit + notif best-effort.
 */
export async function importAoi(
  buffer: Buffer,
  sourceFile: string | undefined,
  actor: ImportActor,
): Promise<ImportResult> {
  const parsed: ParseResult = parseAoiExcel(buffer);

  // Saring orderNo yang sudah ada (unique index — hindari E11000 saat insertMany).
  const orderNos = parsed.canals.map((c) => c.orderNo);
  const existing = await Canal.find({ orderNo: { $in: orderNos } })
    .select('orderNo')
    .lean<{ orderNo: string }[]>()
    .exec();
  const existingSet = new Set(existing.map((e) => e.orderNo));
  const duplicates = parsed.canals.filter((c) => existingSet.has(c.orderNo)).map((c) => c.orderNo);
  const fresh = parsed.canals.filter((c) => !existingSet.has(c.orderNo));

  const aoiDoc = await Aoi.create({
    region: parsed.header.region,
    area: parsed.header.area,
    vendor: parsed.header.vendor,
    importedBy: new mongoose.Types.ObjectId(actor.id),
    importedAt: new Date(),
    canalCount: fresh.length,
    sourceFile,
  });

  if (fresh.length > 0) {
    await Canal.insertMany(
      fresh.map((c) => ({ ...c, aoiId: aoiDoc._id })),
      { ordered: false },
    );
  }

  await Promise.allSettled([
    AuditLog.create({
      userId: new mongoose.Types.ObjectId(actor.id),
      userName: actor.name,
      userInitials: actor.initials,
      action: 'import',
      kind: 'AOI imported',
      target: `${parsed.header.region} · ${parsed.header.area}`,
      detail: `${fresh.length} canal${duplicates.length ? ` · ${duplicates.length} duplikat dilewati` : ''}`,
      ts: new Date(),
    }),
    notifyAdmins({
      title: `AOI baru: ${parsed.header.vendor}`,
      body: `${fresh.length} canal di ${parsed.header.region} / ${parsed.header.area}`,
      link: `/undangan`,
    }),
  ]);

  return {
    aoiId: String(aoiDoc._id),
    canalCount: fresh.length,
    errors: parsed.errors,
    duplicates,
  };
}

/** Kirim notif "undangan" ke semua admin (best-effort). */
async function notifyAdmins(n: { title: string; body: string; link?: string }): Promise<void> {
  const admins = await UserModel.find({ role: 'admin' }).select('_id').lean<{ _id: unknown }[]>().exec();
  if (admins.length === 0) return;
  await Notification.insertMany(
    admins.map((a) => ({
      userId: a._id,
      kind: 'undangan' as const,
      icon: 'mail',
      color: 'brand' as const,
      title: n.title,
      body: n.body,
      read: false,
      ts: new Date(),
      link: n.link,
    })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Aoi (GET /aois, GET /aois/:id)
// ─────────────────────────────────────────────────────────────────────────────

export async function listAois(
  page = 1,
  limit = 20,
): Promise<{ data: AoiDto[]; total: number }> {
  const skip = (Math.max(1, page) - 1) * limit;
  const [docs, total] = await Promise.all([
    Aoi.find().sort({ importedAt: -1 }).skip(skip).limit(limit).lean().exec(),
    Aoi.countDocuments().exec(),
  ]);
  return { data: docs.map((d) => aoiToDto(d as never)), total };
}

export async function getAoi(
  id: string,
): Promise<{ aoi: AoiDto; canals: CanalDto[] } | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const aoi = await Aoi.findById(id).lean().exec();
  if (!aoi) return null;
  const canals = await Canal.find({ aoiId: aoi._id }).sort({ requestDate: -1 }).exec();
  return { aoi: aoiToDto(aoi as never), canals: canals.map((c) => canalToDto(c as CanalDoc)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Canal (GET /canals, GET /canals/:orderNo + siblings)
// ─────────────────────────────────────────────────────────────────────────────

export interface CanalFilter {
  status?: CanalStatus;
  district?: string;
  contractor?: string;
  /** free-text: orderNo / canalId / contractor / district. */
  q?: string;
  page?: number;
  limit?: number;
}

export async function listCanals(
  filter: CanalFilter,
): Promise<{ data: CanalDto[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.district) query.district = filter.district;
  if (filter.contractor) query.contractor = filter.contractor;
  if (filter.q && filter.q.trim()) {
    const rx = new RegExp(escapeRegex(filter.q.trim()), 'i');
    query.$or = [{ orderNo: rx }, { canalId: rx }, { contractor: rx }, { district: rx }];
  }

  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.min(200, filter.limit ?? 50);
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Canal.find(query).sort({ requestDate: -1, status: 1 }).skip(skip).limit(limit).exec(),
    Canal.countDocuments(query).exec(),
  ]);
  return { data: docs.map((c) => canalToDto(c as CanalDoc)), total };
}

/** Detail 1 canal by orderNo + canal lain di kombinasi kontraktor/distrik sama. */
export async function getCanalByOrderNo(
  orderNo: string,
): Promise<{ canal: CanalDto; siblings: CanalDto[]; aoi: AoiDto | null } | null> {
  const doc = await Canal.findOne({ orderNo }).exec();
  if (!doc) return null;
  const siblings = await Canal.find({
    contractor: doc.contractor,
    district: doc.district,
    orderNo: { $ne: orderNo },
  })
    .sort({ requestDate: -1 })
    .exec();
  const aoiDoc = await Aoi.findById(doc.aoiId).lean().exec();
  return {
    canal: canalToDto(doc as CanalDoc),
    siblings: siblings.map((c) => canalToDto(c as CanalDoc)),
    aoi: aoiDoc ? aoiToDto(aoiDoc as never) : null,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
