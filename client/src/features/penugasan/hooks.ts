/**
 * TanStack Query hooks slice `penugasan`.
 *
 * Penugasan "saya" = read server-state (admin field, server-wins) → TanStack Query
 * langsung ke API, BUKAN PouchDB. (Data lapangan operator yang offline-first — parameter/
 * kedalaman — itu PouchDB di slice [lapangan]/[sync]. Penugasan = daftar tugas dari admin,
 * dibaca online; saat offline tampilkan cache terakhir.)
 *
 * Query key: ['penugasan', <scope>, <arg>].
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';

export const penugasanKeys = {
  all: ['penugasan'] as const,
  mine: (tab: api.PenugasanTab) => [...penugasanKeys.all, 'mine', tab] as const,
  detail: (canalId: string) => [...penugasanKeys.all, 'detail', canalId] as const,
};

export function useMinePenugasan(
  tab: api.PenugasanTab,
): UseQueryResult<api.MinePenugasan> {
  return useQuery({
    queryKey: penugasanKeys.mine(tab),
    queryFn: () => api.getMine(tab),
    // Daftar tugas jarang berubah dalam sesi singkat; cache 30 dtk.
    staleTime: 30_000,
  });
}

export function usePenugasanDetail(
  canalId: string | undefined,
): UseQueryResult<api.PenugasanDetail> {
  return useQuery({
    queryKey: penugasanKeys.detail(canalId ?? ''),
    queryFn: () => api.getPenugasanDetail(canalId!),
    enabled: !!canalId,
  });
}

/** Bulk assign (admin). Invalidate kedua tab penugasan. */
export function useAssignCanals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: api.AssignBody) => api.assignCanals(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: penugasanKeys.all }),
  });
}

/** Bulk unassign (admin). */
export function useUnassignCanals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderNos: string[]) => api.unassignCanals(orderNos),
    onSuccess: () => qc.invalidateQueries({ queryKey: penugasanKeys.all }),
  });
}
