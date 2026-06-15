/**
 * usePouchDoc — subscribe 1 doc PouchDB (live) untuk akun aktif.
 *
 * Acuan: PLAN-FE.md hooks/usePouch.ts. SATU JALUR BACA: komponen baca state
 * offline lewat hook ini (bukan fetch). Tulis HARUS lewat sync.writeDoc().
 *
 * Live: pakai `db.changes({ doc_ids })` → re-get saat doc berubah (termasuk
 * dari sync engine pull). Auto re-subscribe saat akun aktif ganti.
 */
import { useEffect, useState } from 'react';
import { getPouch } from './pouch.js';
import { useAuthStore } from '../../features/auth/store.js';
import type { SyncDoc } from '../types.js';

export function usePouchDoc<T = Record<string, unknown>>(
  id: string,
): SyncDoc<T> | null {
  const userId = useAuthStore((s) => s.activeUserId);
  const [doc, setDoc] = useState<SyncDoc<T> | null>(null);

  useEffect(() => {
    if (!userId) {
      setDoc(null);
      return;
    }
    const db = getPouch(userId);
    let cancelled = false;

    const load = () =>
      db
        .get(id)
        .then((d) => {
          if (!cancelled) setDoc(d as unknown as SyncDoc<T>);
        })
        .catch(() => {
          if (!cancelled) setDoc(null);
        });

    void load();
    const feed = db
      .changes({ since: 'now', live: true, doc_ids: [id] })
      .on('change', () => void load());

    return () => {
      cancelled = true;
      feed.cancel();
    };
  }, [userId, id]);

  return doc;
}
