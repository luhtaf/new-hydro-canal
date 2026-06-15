/**
 * useDepthRows — subscribe (live) semua titik kedalaman 1 kanal dari PouchDB.
 *
 * Jalur baca offline-first: query doc `depth:<canalId>:*` lewat allDocs prefix
 * range, urut by STA, re-fetch saat ada change (termasuk dari sync engine pull /
 * drag-edit). Mirip pola usePouchDoc (shared/db) tapi untuk koleksi range.
 *
 * Tidak menulis apa pun — tulisan lewat depthDoc.writeDepth().
 */
import { useEffect, useState } from 'react';
import { getPouch } from '../../shared/db/pouch.js';
import { useAuthStore } from '../auth/store.js';
import { DEPTH_PREFIX, type DepthPayload } from './depthMath.js';
import type { SyncDoc } from '../../shared/types.js';

/** Range prefix scan untuk semua titik 1 kanal. */
function rangeFor(canalId: string): { startkey: string; endkey: string } {
  const base = `${DEPTH_PREFIX}${canalId}:`;
  return { startkey: base, endkey: base + '￿' };
}

export interface UseDepthRows {
  rows: SyncDoc<DepthPayload>[];
  loading: boolean;
}

export function useDepthRows(canalId: string): UseDepthRows {
  const userId = useAuthStore((s) => s.activeUserId);
  const [rows, setRows] = useState<SyncDoc<DepthPayload>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !canalId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const db = getPouch(userId);
    let cancelled = false;

    const load = async () => {
      const res = await db.allDocs({ include_docs: true, ...rangeFor(canalId) });
      if (cancelled) return;
      const docs = res.rows
        .map((r) => r.doc as unknown as SyncDoc<DepthPayload> | undefined)
        .filter((d): d is SyncDoc<DepthPayload> => !!d && !d._deleted)
        .sort((a, b) => a.payload.sta - b.payload.sta);
      setRows(docs);
      setLoading(false);
    };

    void load();
    const feed = db
      .changes({ since: 'now', live: true })
      .on('change', (c) => {
        // hanya reload kalau perubahan menyentuh kanal ini.
        if (c.id.startsWith(`${DEPTH_PREFIX}${canalId}:`)) void load();
      });

    return () => {
      cancelled = true;
      feed.cancel();
    };
  }, [userId, canalId]);

  return { rows, loading };
}
