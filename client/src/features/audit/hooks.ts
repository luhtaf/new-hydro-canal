/**
 * TanStack Query hooks slice `audit` (read-only, server-state).
 *
 * Audit = data server murni (bukan PouchDB local-first) → pakai TanStack Query
 * langsung ke API, sama seperti slice [data] admin CRUD.
 *
 * `useAuditInfinite` = useInfiniteQuery page-based untuk infinite scroll timeline.
 * Query key membawa filter supaya ganti filter = query baru (cache granular).
 */
import {
  useInfiniteQuery,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchAudit, fetchRecentAudit, type AuditFilter, type AuditPage } from './api.js';
import type { AuditLog } from '../../shared/types.js';

const PAGE_SIZE = 25;

export const auditKeys = {
  all: ['audit'] as const,
  list: (filter: AuditFilter) => [...auditKeys.all, 'list', filter] as const,
  recent: (limit: number) => [...auditKeys.all, 'recent', limit] as const,
};

/**
 * Infinite scroll daftar audit terfilter. `getNextPageParam` ikut `hasMore` server.
 * Konsumen: panggil `fetchNextPage()` saat sentinel masuk viewport.
 */
export function useAuditInfinite(filter: AuditFilter) {
  return useInfiniteQuery<AuditPage>({
    queryKey: auditKeys.list(filter),
    queryFn: ({ pageParam }) => fetchAudit(filter, pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 30_000,
  });
}

/** Activity feed dashboard — N terbaru. */
export function useRecentAudit(limit = 5): UseQueryResult<AuditLog[]> {
  return useQuery({
    queryKey: auditKeys.recent(limit),
    queryFn: () => fetchRecentAudit(limit),
    staleTime: 30_000,
  });
}
