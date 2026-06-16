/**
 * useSyncQueue — antrian sync (outbox PouchDB) untuk drawer + badge.
 *
 * Di demo antrian = array di localStorage (ui store). Di produksi sumber
 * kebenaran = outbox durable di PouchDB (spec § D "Outbox pattern"). Hook ini
 * subscribe live ke outbox akun aktif → daftar op pending.
 */
import { useEffect, useState } from 'react';
import { subscribeOutbox } from '../../shared/db/sync.js';
import { useAuthStore } from '../auth/store.js';
import type { OutboxOpDoc } from '../../shared/db/pouch.js';

export function useSyncQueue(): OutboxOpDoc[] {
  const userId = useAuthStore((s) => s.activeUserId);
  const [ops, setOps] = useState<OutboxOpDoc[]>([]);

  useEffect(() => {
    if (!userId) {
      setOps([]);
      return;
    }
    return subscribeOutbox(userId, setOps);
  }, [userId]);

  return ops;
}
