/**
 * Conflict detection + strategy (spec § D "Conflict resolution").
 *
 * Per-doc timestamp-based: client kirim `serverBase` (updatedAt server saat ia terakhir
 * pull doc ini). Saat push, bandingkan `serverBase` vs `currentServerUpdatedAt`:
 *   - sama / client lebih baru basisnya → tidak ada perubahan server di antaranya → OK.
 *   - server lebih baru → ada edit lain → CONFLICT (kecuali strategi auto-resolve).
 *
 * Strategi default per tipe field:
 *   | parameter (WL, dimensi, dll) | LWW — timestamp lebih baru menang (auto)      |
 *   | depth (drag-edit kedalaman)  | MANUAL — selalu conflict, butuh UI pick       |
 *   | admin-field (status/assignedTo/threshold) | SERVER-WINS — operator ditolak    |
 */
import type { SyncDoc, SyncDocType } from '../../shared/types.js';

export type Strategy = 'lww' | 'manual' | 'server-wins';

/** Field admin (server-wins) yang operator tidak boleh override lewat sync. */
export const ADMIN_FIELDS = new Set(['status', 'assignedTo', 'usv', 'threshold', 'qcOutput']);

/** Tentukan strategi untuk sebuah doc. */
export function strategyFor(doc: Pick<SyncDoc, 'type' | 'payload'>): Strategy {
  if (doc.type === 'depth') return 'manual';
  if (doc.type === 'parameter') return 'lww';
  // canal/meta: kalau payload menyentuh admin-field → server-wins.
  const payload = doc.payload as Record<string, unknown> | undefined;
  if (payload && Object.keys(payload).some((k) => ADMIN_FIELDS.has(k))) {
    return 'server-wins';
  }
  return 'lww';
}

export interface ConflictDecision {
  /** apakah perubahan client boleh ditulis. */
  accept: boolean;
  /** apakah harus dilaporkan sebagai conflict ke client (butuh UI resolve). */
  conflict: boolean;
  strategy: Strategy;
}

/**
 * Putuskan nasib satu doc push.
 *
 * @param incoming        doc dari client
 * @param serverUpdatedAt updatedAt doc di server saat ini (null = belum ada → insert)
 */
export function decide(
  incoming: Pick<SyncDoc, 'type' | 'payload' | 'serverBase' | 'updatedAt'>,
  serverUpdatedAt: string | null,
): ConflictDecision {
  const strategy = strategyFor(incoming);

  // Doc baru di server → selalu terima (insert), tak mungkin konflik.
  if (serverUpdatedAt === null) {
    return { accept: true, conflict: false, strategy };
  }

  const base = incoming.serverBase ? Date.parse(incoming.serverBase) : Number.NaN;
  const serverTs = Date.parse(serverUpdatedAt);

  // Tak ada edit server sejak client pull (basis cocok / lebih baru) → terima.
  const serverChanged = Number.isNaN(base) ? true : serverTs > base;
  if (!serverChanged) {
    return { accept: true, conflict: false, strategy };
  }

  // Server berubah sejak basis client → resolusi per strategi.
  switch (strategy) {
    case 'server-wins':
      // Operator tak boleh override admin-field; tolak diam-diam (bukan conflict UI).
      return { accept: false, conflict: false, strategy };
    case 'lww': {
      // Timestamp lebih baru menang. Tie → server menang (accept=false, tak conflict).
      const clientTs = Date.parse(incoming.updatedAt);
      const clientWins = !Number.isNaN(clientTs) && clientTs > serverTs;
      return { accept: clientWins, conflict: false, strategy };
    }
    case 'manual':
    default:
      // Kedalaman: selalu butuh keputusan manual.
      return { accept: false, conflict: true, strategy };
  }
}

/** Kelompokkan tipe untuk laporan ringkas. */
export function isFieldType(t: SyncDocType): t is SyncDocType {
  return ['parameter', 'depth', 'canal', 'meta'].includes(t);
}
