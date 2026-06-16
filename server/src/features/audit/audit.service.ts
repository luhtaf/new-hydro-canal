/**
 * Service Audit — query AuditLog (read-only, admin-only).
 *
 * Penulisan AuditLog dilakukan shared/middleware/audit (dipanggil tiap slice mutasi);
 * slice ini HANYA membaca. Pakai model `AuditLog` shared via barrel.
 *
 * Pagination: page-based (PLAN-BE `GET /audit?…&page`). Sort ts desc memanfaatkan
 * index `{ ts: -1 }` (+ `{ userId, ts }` / `{ action, ts }` saat difilter).
 */
import type { FilterQuery } from 'mongoose';
import { AuditLog, type AuditLogDoc } from '../../shared/models/index.js';
import type { AuditAction, AuditLog as AuditLogDTO } from '../../shared/types.js';

export interface AuditQuery {
  userId?: string;
  action?: AuditAction;
  /** Batas bawah ts (ISO atau Date-parseable). Inklusif. */
  from?: string;
  /** Batas atas ts. Inklusif (di-set ke akhir hari kalau hanya tanggal). */
  to?: string;
  /** Pencarian teks bebas di userName/kind/target/detail. */
  q?: string;
  page?: number;
  limit?: number;
}

export interface AuditPage {
  items: AuditLogDTO[];
  page: number;
  limit: number;
  total: number;
  /** Apakah masih ada halaman berikutnya (untuk infinite scroll FE). */
  hasMore: boolean;
}

/** Bangun filter Mongo dari query (dipakai count + find). Exported untuk unit test. */
export function buildFilter(q: AuditQuery): FilterQuery<AuditLogDoc> {
  const filter: FilterQuery<AuditLogDoc> = {};
  if (q.userId) filter.userId = q.userId;
  if (q.action) filter.action = q.action;

  if (q.from || q.to) {
    const ts: { $gte?: Date; $lte?: Date } = {};
    if (q.from) {
      const d = new Date(q.from);
      if (!Number.isNaN(d.getTime())) ts.$gte = d;
    }
    if (q.to) {
      const d = new Date(q.to);
      if (!Number.isNaN(d.getTime())) {
        // Kalau `to` cuma tanggal (tanpa jam), jangkau seluruh hari itu.
        if (/^\d{4}-\d{2}-\d{2}$/.test(q.to.trim())) {
          d.setHours(23, 59, 59, 999);
        }
        ts.$lte = d;
      }
    }
    if (ts.$gte || ts.$lte) filter.ts = ts;
  }

  if (q.q && q.q.trim()) {
    // Pencarian case-insensitive lintas field display (denormalized).
    const rx = new RegExp(escapeRegExp(q.q.trim()), 'i');
    filter.$or = [
      { userName: rx },
      { kind: rx },
      { target: rx },
      { detail: rx },
    ];
  }

  return filter;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Map dokumen lean → DTO wire (ts ISO string, _id string). */
function toDTO(doc: AuditLogDoc): AuditLogDTO {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    userName: doc.userName,
    userInitials: doc.userInitials ?? '',
    action: doc.action as AuditAction,
    kind: doc.kind ?? '',
    target: doc.target ?? '',
    detail: doc.detail ?? undefined,
    ts: (doc.ts instanceof Date ? doc.ts : new Date(doc.ts as unknown as string)).toISOString(),
  };
}

/** GET /audit — daftar terfilter + paginasi (terbaru dulu). */
export async function listAudit(q: AuditQuery): Promise<AuditPage> {
  const page = Math.max(1, Math.floor(q.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(q.limit ?? 25)));
  const filter = buildFilter(q);

  const [docs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ ts: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<AuditLogDoc[]>()
      .exec(),
    AuditLog.countDocuments(filter).exec(),
  ]);

  return {
    items: docs.map(toDTO),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}

/** GET /audit/recent — N entri terbaru untuk activity feed dashboard. */
export async function recentAudit(limit = 5): Promise<AuditLogDTO[]> {
  const n = Math.min(50, Math.max(1, Math.floor(limit)));
  const docs = await AuditLog.find()
    .sort({ ts: -1 })
    .limit(n)
    .lean<AuditLogDoc[]>()
    .exec();
  return docs.map(toDTO);
}
