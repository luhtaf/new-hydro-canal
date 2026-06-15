/**
 * Service sync — orkestrasi push/pull/seed terhadap Mongo via projection.
 *
 * Idempotency: push memakai (docId, updatedAt) sebagai kunci efek. Mengirim doc yang
 * SAMA 2x = efek sekali (apply parameter/depth bersifat upsert-by-key; titik depth
 * di-set by STA, bukan di-append buta). Plus guard `serverBase` mencegah double-apply
 * regresi karena timestamp.
 *
 * Timestamp: model legacy `Data` SENGAJA tanpa `timestamps` (kompat data lama), jadi
 * sync menyimpan `updatedAt` proyeksinya di `SyncDocMeta` (by canalId). Itu basis
 * conflict detection + cursor `pull?since=`.
 *
 * SATU jalur tulis (spec § D): UI hanya ke PouchDB; service ini satu-satunya yang
 * memproyeksikan flat→Data nested di server.
 */
import type { SyncDoc, PushResult, PullResponse } from '../../shared/types.js';
import { getModel, hasModel, MODEL, SyncCursor, SyncDocMeta } from './models.js';
import {
  parseDocId,
  applyParameter,
  applyDepth,
  dataToFlatDocs,
  type ProjectedData,
  type ParameterPayload,
  type DepthPayload,
} from './projection.js';
import { decide } from './conflict.js';

interface CanalDoc {
  _id: unknown;
  canalId: string;
  finishDate?: string | Date;
  dataId?: unknown;
  assignedTo?: unknown;
  status?: string;
}

interface DataDoc extends ProjectedData {
  _id: unknown;
}

/** Cari Data nested yang memuat canalId (via Canal.dataId atau cari di canal_data). */
async function findDataForCanal(canalId: string): Promise<DataDoc | null> {
  const Data = getModel<DataDoc>(MODEL.Data);
  if (hasModel(MODEL.Canal)) {
    const Canal = getModel<CanalDoc>(MODEL.Canal);
    const canal = await Canal.findOne({ canalId }).lean<CanalDoc>().exec();
    if (canal?.dataId) {
      const byId = await Data.findById(canal.dataId).exec();
      if (byId) return byId as unknown as DataDoc;
    }
  }
  const doc = await Data.findOne({ 'canal_data.canal_id': canalId }).exec();
  return (doc as unknown as DataDoc) ?? null;
}

/** Finish date AOI untuk clamp measure date. */
async function finishDateForCanal(canalId: string): Promise<string | Date | undefined> {
  if (!hasModel(MODEL.Canal)) return undefined;
  const Canal = getModel<CanalDoc>(MODEL.Canal);
  const canal = await Canal.findOne({ canalId }).lean<CanalDoc>().exec();
  return canal?.finishDate;
}

/** ISO updatedAt proyeksi canal (null kalau belum pernah disinkron). */
async function serverUpdatedAtFor(canalId: string): Promise<string | null> {
  const meta = await SyncDocMeta().findOne({ canalId }).lean().exec();
  return meta?.updatedAt ?? null;
}

/** Set stempel updatedAt proyeksi canal. */
async function stampCanal(canalId: string, updatedAt: string): Promise<void> {
  await SyncDocMeta()
    .updateOne({ canalId }, { $set: { updatedAt } }, { upsert: true })
    .exec();
}

/**
 * PUSH satu batch doc. Per-doc: deteksi conflict, apply via projection, upsert Data.
 * Return hasil per-doc (ok/rev atau conflict) — idempotent.
 */
export async function pushDocs(docs: SyncDoc[]): Promise<PushResult[]> {
  const Data = getModel<DataDoc>(MODEL.Data);
  const results: PushResult[] = [];

  for (const doc of docs) {
    const parsed = parseDocId(doc._id);
    if (!parsed) {
      results.push({ id: doc._id, ok: false, conflict: { lokal: doc, server: doc } });
      continue;
    }

    const serverUpdatedAt = await serverUpdatedAtFor(parsed.canalId);
    const decision = decide(doc, serverUpdatedAt);

    if (!decision.accept) {
      if (decision.conflict) {
        const data = await findDataForCanal(parsed.canalId);
        const serverDoc: SyncDoc = data
          ? (dataToFlatDocs(data, {
              updatedAt: serverUpdatedAt ?? doc.updatedAt,
            }).find((d) => d._id === doc._id) ?? { ...doc, serverBase: serverUpdatedAt })
          : { ...doc, serverBase: serverUpdatedAt };
        results.push({ id: doc._id, ok: false, conflict: { lokal: doc, server: serverDoc } });
      } else {
        // server-wins / lww-kalah → ditolak diam-diam; client harus pull versi server.
        results.push({ id: doc._id, ok: true, rev: serverUpdatedAt ?? undefined });
      }
      continue;
    }

    // Terima: rakit ke Data nested + upsert.
    const existing = await findDataForCanal(parsed.canalId);
    const data: ProjectedData = existing
      ? { batang_canal_id: existing.batang_canal_id, canal_data: existing.canal_data }
      : { batang_canal_id: parsed.canalId, canal_data: [] };

    if (parsed.kind === 'parameter') {
      const finishDate = await finishDateForCanal(parsed.canalId);
      applyParameter(data, doc.payload as unknown as ParameterPayload, { finishDate });
    } else {
      applyDepth(data, doc.payload as unknown as DepthPayload);
    }

    let savedId: unknown;
    if (existing) {
      await Data.updateOne(
        { _id: existing._id },
        { $set: { canal_data: data.canal_data, batang_canal_id: data.batang_canal_id } },
      ).exec();
      savedId = existing._id;
    } else {
      const created = await Data.create(data);
      savedId = (created as unknown as { _id: unknown })._id;
      if (hasModel(MODEL.Canal)) {
        const Canal = getModel<CanalDoc>(MODEL.Canal);
        await Canal.updateOne(
          { canalId: parsed.canalId, dataId: { $in: [null, undefined] } },
          { $set: { dataId: savedId } },
        ).exec();
      }
    }

    // Stempel waktu baru = updatedAt doc (monoton; idempoten karena set, bukan increment).
    const rev = doc.updatedAt;
    await stampCanal(parsed.canalId, rev);
    results.push({ id: doc._id, ok: true, rev });
  }

  return results;
}

/**
 * PULL perubahan sejak `since` (ISO updatedAt). Pecah Data jadi doc flat.
 * Scope ke canal milik user (kalau Canal terdaftar) + filter SyncDocMeta.updatedAt > since.
 */
export async function pullChanges(
  userId: string,
  since: string | undefined,
  limit = 100,
): Promise<PullResponse> {
  const Data = getModel<DataDoc>(MODEL.Data);
  const sinceIso = since ?? new Date(0).toISOString();

  // canal yang berubah sejak since.
  const metas = await SyncDocMeta()
    .find({ updatedAt: { $gt: sinceIso } })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean()
    .exec();

  // batasi ke canal milik user kalau Canal ada.
  let allowed: Set<string> | null = null;
  if (hasModel(MODEL.Canal)) {
    const Canal = getModel<CanalDoc>(MODEL.Canal);
    const mine = await Canal.find({ assignedTo: userId })
      .select('canalId')
      .lean<{ canalId: string }[]>()
      .exec();
    allowed = new Set(mine.map((c) => c.canalId));
  }

  const changes: SyncDoc[] = [];
  let lastSeq = sinceIso;
  for (const meta of metas) {
    if (allowed && !allowed.has(meta.canalId)) continue;
    const data = await findDataForCanal(meta.canalId);
    if (data) {
      changes.push(...dataToFlatDocs(data, { updatedAt: meta.updatedAt }));
    }
    if (meta.updatedAt > lastSeq) lastSeq = meta.updatedAt;
  }

  await SyncCursor()
    .updateOne({ userId }, { $set: { lastSeq } }, { upsert: true })
    .exec()
    .catch(() => undefined);

  void Data;
  return { changes, lastSeq };
}

/**
 * SEED awal saat login: penugasan saya (Canal assigned) + master (district/threshold/
 * contractor) + parameter draft (Data terkait). Client bulkDocs ke PouchDB.
 */
export async function seedForUser(userId: string): Promise<{
  canals: unknown[];
  districts: unknown[];
  contractors: unknown[];
  threshold: unknown;
  drafts: SyncDoc[];
}> {
  const result = {
    canals: [] as unknown[],
    districts: [] as unknown[],
    contractors: [] as unknown[],
    threshold: null as unknown,
    drafts: [] as SyncDoc[],
  };

  if (hasModel(MODEL.Canal)) {
    const Canal = getModel<CanalDoc>(MODEL.Canal);
    result.canals = await Canal.find({ assignedTo: userId }).lean().exec();
  }
  if (hasModel(MODEL.District)) {
    result.districts = await getModel(MODEL.District).find({}).lean().exec();
  }
  if (hasModel(MODEL.Contractor)) {
    result.contractors = await getModel(MODEL.Contractor).find({ isActive: true }).lean().exec();
  }
  if (hasModel(MODEL.Pengukuran)) {
    result.threshold = await getModel(MODEL.Pengukuran).findOne({}).lean().exec();
  }

  // parameter draft = Data nested untuk canal milik user → pecah jadi flat docs.
  const canalIds = (result.canals as { canalId?: string }[]).map((c) => c.canalId).filter(Boolean);
  for (const canalId of canalIds as string[]) {
    const data = await findDataForCanal(canalId);
    if (!data) continue;
    const meta = await SyncDocMeta().findOne({ canalId }).lean().exec();
    const updatedAt = meta?.updatedAt ?? new Date().toISOString();
    result.drafts.push(...dataToFlatDocs(data, { updatedAt }));
  }

  return result;
}
