/**
 * Middleware audit — log tiap mutasi sukses (POST/PATCH/PUT/DELETE) ke AuditLog.
 *
 * Cross-cutting (dipakai >=2 fitur: data, penugasan, undangan, pengukuran, qc, sync)
 * → ditaruh di shared/middleware (guardrail global #1). Slice [audit] yang MEMBACA
 * (GET /audit) memiliki middleware ini secara konvensi, tapi semua slice mutasi
 * memakainya untuk menghasilkan jejak.
 *
 * Pola (PLAN-BE.md "Audit middleware"): bungkus `res.json`. Catat HANYA kalau status
 * < 400 (mutasi benar-benar sukses). Penulisan AuditLog fire-and-forget — kegagalan
 * log TIDAK boleh menggagalkan request bisnis; error cukup di-log ke req.log.
 *
 * `kind`/`target`/`detail` di-derive dari req/res via callback supaya tiap call site
 * bisa menjelaskan aksinya dalam bahasa manusia ("Drag-edit kedalaman", target
 * "KBN01-K02 · STA 720") tanpa mencemari controller dengan logika audit.
 */
import type { Request, RequestHandler, Response } from 'express';
import { AuditLog } from '../models/index.js';
import type { AuthUser } from './auth.js';
import type { AuditAction } from '../types.js';

/** Konteks yang dilihat extractor: request + body response yang akan dikirim. */
export interface AuditContext {
  req: Request;
  /** Body JSON yang dikembalikan handler (untuk derive detail dari hasil). */
  resBody: unknown;
}

/** String atau extractor dinamis dari konteks. */
type Derivable = string | ((ctx: AuditContext) => string | undefined);

export interface AuditOptions {
  action: AuditAction;
  /** Ringkas aksi, mis. "Assign petugas", "Drag-edit kedalaman". */
  kind: Derivable;
  /** Objek yang dikenai, mis. "PAT-2026-0042" / "KBN01-K02 · STA 720". */
  target: Derivable;
  /** Detail opsional, mis. "2.710 → 2.840" / "24 dokumen". Default `req.body.detail`. */
  detail?: Derivable;
}

function resolve(d: Derivable | undefined, ctx: AuditContext): string | undefined {
  if (d === undefined) return undefined;
  return typeof d === 'function' ? d(ctx) : d;
}

/** Logger ringan dari request (Express tak punya req.log default). */
function logError(req: Request, err: unknown): void {
  const log = (req as Request & { log?: { error: (e: unknown) => void } }).log;
  if (log) log.error(err);
  else console.error('[audit] gagal tulis AuditLog:', err);
}

/**
 * Factory middleware audit. Pasang SETELAH requireAuth (butuh authUser) dan
 * SEBELUM handler. Contoh:
 *
 *   router.patch('/updatechartdata/:id', requireAuth,
 *     audit({ action: 'edit', kind: 'Drag-edit kedalaman',
 *             target: (c) => c.req.params.id }),
 *     c.updateChartData);
 */
export function audit(opts: AuditOptions): RequestHandler {
  return (req: Request, res: Response, next) => {
    const original = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode < 400) {
        const ctx: AuditContext = { req, resBody: body };
        const u = (req as Request & { authUser?: AuthUser }).authUser;
        const fallbackDetail = (req.body as { detail?: unknown } | undefined)?.detail;
        // Fire-and-forget: jangan ganggu jalur response bisnis.
        AuditLog.create({
          userId: u?.id,
          userName: u?.name ?? 'Sistem',
          userInitials: u?.initials ?? '',
          action: opts.action,
          kind: resolve(opts.kind, ctx) ?? '',
          target: resolve(opts.target, ctx) ?? '',
          detail:
            resolve(opts.detail, ctx) ??
            (typeof fallbackDetail === 'string' ? fallbackDetail : undefined),
          ts: new Date(),
        }).catch((err) => logError(req, err));
      }
      return original(body);
    };
    next();
  };
}

/**
 * Helper imperatif untuk slice yang ingin mencatat audit di luar siklus res.json
 * (mis. job sync yang memproses banyak doc, atau resolusi konflik). Selalu
 * fire-and-forget; pemanggil tidak perlu await.
 */
export function logAudit(
  user: Pick<AuthUser, 'id' | 'name' | 'initials'> | null,
  entry: {
    action: AuditAction;
    kind: string;
    target: string;
    detail?: string;
  },
): void {
  AuditLog.create({
    userId: user?.id,
    userName: user?.name ?? 'Sistem',
    userInitials: user?.initials ?? '',
    action: entry.action,
    kind: entry.kind,
    target: entry.target,
    detail: entry.detail,
    ts: new Date(),
  }).catch((err) => console.error('[audit] logAudit gagal:', err));
}
