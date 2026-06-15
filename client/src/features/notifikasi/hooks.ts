/**
 * TanStack Query hooks slice `notifikasi`.
 * Server-state (inbox notif) lewat TanStack Query langsung ke API. Bukan PouchDB:
 * notif dibaca online; mutasi read di-optimistic-update supaya badge & list instan.
 *
 * Query key konvensi: ['notifikasi', <scope>] untuk invalidasi granular.
 * `useUnreadCount` adalah selector turunan dari cache inbox → 1 sumber data, dipakai
 * NotifBadge (sidebar + tab title) tanpa fetch terpisah.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';
import type { Notification } from '../../shared/types.js';

export const notifKeys = {
  all: ['notifikasi'] as const,
  inbox: () => [...notifKeys.all, 'inbox'] as const,
};

/** Inbox + unread. Refetch ringan tiap 60s supaya badge tetap segar tanpa SSE. */
export function useInbox(): UseQueryResult<api.InboxResponse> {
  return useQuery({
    queryKey: notifKeys.inbox(),
    queryFn: api.listMine,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Selector unread untuk badge global (sidebar + tab title). Mengambil dari cache
 * inbox bila ada; kalau belum pernah fetch, kembalikan 0 (badge tersembunyi).
 * Tetap berlangganan query supaya re-render saat unread berubah.
 */
export function useUnreadCount(): number {
  const { data } = useInbox();
  return data?.unread ?? 0;
}

/** Helper: hitung ulang unread dari daftar item (untuk optimistic update). */
function countUnread(items: Notification[]): number {
  return items.reduce((n, it) => (it.read ? n : n + 1), 0);
}

/** Tandai 1 notif dibaca — optimistic (list & badge update sebelum server balas). */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notifKeys.inbox() });
      const prev = qc.getQueryData<api.InboxResponse>(notifKeys.inbox());
      if (prev) {
        const items = prev.items.map((it) =>
          it._id === id ? { ...it, read: true } : it,
        );
        qc.setQueryData<api.InboxResponse>(notifKeys.inbox(), {
          items,
          unread: countUnread(items),
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notifKeys.inbox(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifKeys.inbox() });
    },
  });
}

/** Tandai SEMUA dibaca — optimistic. */
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notifKeys.inbox() });
      const prev = qc.getQueryData<api.InboxResponse>(notifKeys.inbox());
      if (prev) {
        qc.setQueryData<api.InboxResponse>(notifKeys.inbox(), {
          items: prev.items.map((it) => ({ ...it, read: true })),
          unread: 0,
        });
      }
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(notifKeys.inbox(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifKeys.inbox() });
    },
  });
}
