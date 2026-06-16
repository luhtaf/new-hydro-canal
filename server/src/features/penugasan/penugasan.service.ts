/**
 * Service Penugasan — logika murni di atas model shared `Canal` (+ lookup `Data`).
 *
 * Dua tanggung jawab:
 *   1. ASSIGN/UNASSIGN (admin): Submitted → Assigned (bulk by orderNo). Set assignedTo/
 *      usv/assignedAt/status. Ini ADMIN-FIELD → server-wins saat sync (spec § D): operator
 *      offline TIDAK boleh override. Kita tetap stempel `updatedAt` lewat timestamps mongoose.
 *   2. QUERY "penugasan saya" (auth): canal ber-assignedTo = user, di-group
 *      Kontraktor → Distrik (DOMAIN.md poin 2 multi-distrik/kontraktor) + chip ringkasan.
 *
 * Tidak ada Express di sini (dipanggil controller; bisa dipakai fitur lain).
 */
import { Types } from 'mongoose';
import { Canal, type CanalDoc } from '../../shared/models/Canal.js';
import { deadlineInfo } from '../../shared/domain/deadline.js';
import { shortName } from '../../shared/domain/shortName.js';
import type { CanalStatus, DeadlineInfo, UsvCode } from '../../shared/types.js';

/** Tab di halaman "Penugasan saya". */
export type PenugasanTab = 'aktif' | 'selesai';

/** Status yang dianggap "aktif" (belum Done). */
const ACTIVE_STATUSES: CanalStatus[] = ['Assigned', 'In Progress'];

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN / UNASSIGN (admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface AssignInput {
  orderNos: string[];
  assignedTo: string; // User._id
  usv: UsvCode;
}

/**
 * Assign bulk canal ke operator. HANYA canal berstatus `Submitted` yang ikut transisi
 * (Submitted → Assigned) — idempoten & aman dari double-assign yang menimpa progress.
 * Return jumlah yang benar-benar berubah.
 */
export async function assignCanals(
  input: AssignInput,
): Promise<{ updated: number; assignedTo: string; usv: UsvCode }> {
  if (!Types.ObjectId.isValid(input.assignedTo)) {
    const err = new Error('assignedTo bukan ObjectId valid') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const res = await Canal.updateMany(
    { orderNo: { $in: input.orderNos }, status: 'Submitted' },
    {
      $set: {
        assignedTo: new Types.ObjectId(input.assignedTo),
        usv: input.usv,
        assignedAt: new Date(),
        status: 'Assigned',
      },
    },
  ).exec();

  return {
    updated: res.modifiedCount ?? 0,
    assignedTo: input.assignedTo,
    usv: input.usv,
  };
}

/**
 * Unassign bulk: balik ke `Submitted`, kosongkan assignedTo/usv/assignedAt. HANYA canal
 * yang masih `Assigned` (belum mulai diisi / belum Done) — jangan tarik balik pekerjaan
 * yang sudah In Progress / Done supaya tidak menghapus jejak operator.
 */
export async function unassignCanals(
  orderNos: string[],
): Promise<{ updated: number }> {
  const res = await Canal.updateMany(
    { orderNo: { $in: orderNos }, status: 'Assigned' },
    {
      $set: { status: 'Submitted' },
      $unset: { assignedTo: '', usv: '', assignedAt: '' },
    },
  ).exec();
  return { updated: res.modifiedCount ?? 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY "penugasan saya" — grouped Kontraktor → Distrik (+ chip)
// ─────────────────────────────────────────────────────────────────────────────

/** 1 canal card di UI (subset Canal + turunan deadline/short). */
export interface PenugasanCanal {
  orderNo: string;
  canalId: string;
  district: string;
  contractor: string;
  panjang: number;
  dimensi: string;
  measurePoint: string;
  coordX: number;
  coordY: number;
  requestDate: string;
  startDate: string;
  finishDate: string;
  requestType: string;
  status: CanalStatus;
  usv: UsvCode | null;
  qcOutput: string | null;
  /** turunan deadline (DOMAIN.md poin 1) — dihitung server supaya FE konsisten. */
  deadline: { daysLeft: number; label: string; tone: DeadlineInfo['tone'] };
}

/** Sub-group per distrik dalam 1 kontraktor. */
export interface PenugasanDistrict {
  district: string;
  totalMeter: number;
  canals: PenugasanCanal[];
}

/** Group per kontraktor (DOMAIN.md poin 2). */
export interface PenugasanContractor {
  contractor: string;
  shortName: string;
  /** chip ringkasan: jumlah kanal, total meter, deadline terdekat. */
  summary: {
    canalCount: number;
    districtCount: number;
    totalMeter: number;
    nearest: { daysLeft: number; label: string; tone: DeadlineInfo['tone'] };
  };
  districts: PenugasanDistrict[];
}

/** Bentuk respons GET /penugasan/mine. */
export interface MinePenugasan {
  tab: PenugasanTab;
  total: number;
  groups: PenugasanContractor[];
}

function toCard(c: CanalDoc, now: Date): PenugasanCanal {
  const dl = deadlineInfo(new Date(c.requestDate), now);
  return {
    orderNo: c.orderNo,
    canalId: c.canalId,
    district: c.district,
    contractor: c.contractor,
    panjang: c.panjang,
    dimensi: c.dimensi ?? '',
    measurePoint: c.measurePoint ?? '',
    coordX: c.coordX,
    coordY: c.coordY,
    requestDate: new Date(c.requestDate).toISOString(),
    startDate: new Date(c.startDate).toISOString(),
    finishDate: new Date(c.finishDate).toISOString(),
    requestType: c.requestType ?? 'QC',
    status: c.status as CanalStatus,
    usv: (c.usv as UsvCode | null) ?? null,
    qcOutput: c.qcOutput ?? null,
    deadline: { daysLeft: dl.daysLeft, label: dl.label, tone: dl.tone },
  };
}

/**
 * Group kartu → Kontraktor → Distrik + chip ringkasan. PURE (tanpa DB) supaya bisa
 * di-unit-test (port persis logika `renderPenugasan` demo). Sort: kontraktor by deadline
 * terdekat, canal by deadline ascending (yang paling mepet di atas).
 */
export function groupPenugasan(cards: PenugasanCanal[]): PenugasanContractor[] {
  // Group: Kontraktor → Distrik (Map jaga urutan insert = urutan kedatangan).
  const byContractor = new Map<string, Map<string, PenugasanCanal[]>>();
  for (const card of cards) {
    let dist = byContractor.get(card.contractor);
    if (!dist) {
      dist = new Map();
      byContractor.set(card.contractor, dist);
    }
    const list = dist.get(card.district) ?? [];
    list.push(card);
    dist.set(card.district, list);
  }

  const groups: PenugasanContractor[] = [...byContractor.entries()].map(
    ([contractor, distMap]) => {
      const districts: PenugasanDistrict[] = [...distMap.entries()].map(
        ([district, canals]) => ({
          district,
          totalMeter: canals.reduce((s, c) => s + c.panjang, 0),
          canals: canals.sort((a, b) => a.deadline.daysLeft - b.deadline.daysLeft),
        }),
      );
      const allCanals = districts.flatMap((d) => d.canals);
      const totalMeter = allCanals.reduce((s, c) => s + c.panjang, 0);
      const nearest = allCanals
        .map((c) => c.deadline)
        .sort((a, b) => a.daysLeft - b.daysLeft)[0] ?? {
        daysLeft: 0,
        label: '—',
        tone: 'slate' as DeadlineInfo['tone'],
      };
      return {
        contractor,
        shortName: shortName(contractor),
        summary: {
          canalCount: allCanals.length,
          districtCount: districts.length,
          totalMeter,
          nearest,
        },
        districts,
      };
    },
  );

  // Sort kontraktor by deadline terdekat (paling mepet di atas).
  groups.sort((a, b) => a.summary.nearest.daysLeft - b.summary.nearest.daysLeft);

  return groups;
}

/**
 * Penugasan milik user, grouped Kontraktor → Distrik. tab=selesai → status Done;
 * tab=aktif → Assigned/In Progress.
 */
export async function listMine(
  userId: string,
  tab: PenugasanTab,
  now: Date = new Date(),
): Promise<MinePenugasan> {
  const statusFilter: CanalStatus[] = tab === 'selesai' ? ['Done'] : ACTIVE_STATUSES;

  const docs = Types.ObjectId.isValid(userId)
    ? await Canal.find({
        assignedTo: new Types.ObjectId(userId),
        status: { $in: statusFilter },
      })
        .sort({ requestDate: 1 })
        .lean<CanalDoc[]>()
        .exec()
    : [];

  const cards = docs.map((d) => toCard(d, now));
  return { tab, total: docs.length, groups: groupPenugasan(cards) };
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL 1 canal (+ Data lookup)
// ─────────────────────────────────────────────────────────────────────────────

/** Detail penugasan: full Canal + ringkasan progress dari Data (kalau sudah ditaut). */
export interface PenugasanDetail {
  canal: PenugasanCanal & {
    aoiId: string;
    assignedTo: string | null;
    assignedAt: string | null;
    dataId: string | null;
  };
  /** progress turunan dari Data nested (null kalau belum ada Data). */
  progress: {
    hasParameter: boolean;
    depthPoints: number;
    hasOutput: boolean;
  };
}

/**
 * GET /penugasan/:canalId — :canalId = Canal.orderNo (identitas canonical). Lookup Data
 * via Canal.dataId untuk ringkasan progress (parameter terisi? berapa titik kedalaman?).
 * Tidak meng-embed Data penuh (FE chart pakai endpoint data slice).
 */
export async function getDetail(orderNo: string): Promise<PenugasanDetail | null> {
  const c = await Canal.findOne({ orderNo }).lean<CanalDoc>().exec();
  if (!c) return null;

  const card = toCard(c, new Date());

  let progress = { hasParameter: false, depthPoints: 0, hasOutput: !!c.qcOutput };
  if (c.dataId) {
    // Lookup Data by-name (decoupled dari slice data; lihat data.models.ts pola sama).
    const DataModel = (await import('mongoose')).default.models.Data;
    if (DataModel) {
      const data = await DataModel.findById(c.dataId)
        .lean<{ canal_data?: { data?: unknown[] }[] }>()
        .exec();
      if (data?.canal_data?.length) {
        progress = {
          hasParameter: true,
          depthPoints: data.canal_data.reduce(
            (s, seg) => s + (seg.data?.length ?? 0),
            0,
          ),
          hasOutput: !!c.qcOutput,
        };
      }
    }
  }

  return {
    canal: {
      ...card,
      aoiId: String(c.aoiId),
      assignedTo: c.assignedTo ? String(c.assignedTo) : null,
      assignedAt: c.assignedAt ? new Date(c.assignedAt).toISOString() : null,
      dataId: c.dataId ? String(c.dataId) : null,
    },
    progress,
  };
}
