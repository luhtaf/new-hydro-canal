/**
 * TanStack Query hooks slice `undangan`.
 * Server-state (AOI/Canal) lewat TanStack Query langsung ke API (jalur online admin
 * + read operator). Offline-first kedalaman/parameter operator = slice [sync]/PouchDB.
 *
 * Query key konvensi: ['undangan', <scope>, <args?>] untuk invalidasi granular.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';
import type { Id } from '../../shared/types.js';

export const undanganKeys = {
  all: ['undangan'] as const,
  aoiList: (page: number, limit: number) =>
    [...undanganKeys.all, 'aois', page, limit] as const,
  aoi: (id: Id) => [...undanganKeys.all, 'aoi', id] as const,
  canalList: (filter: api.CanalFilter) =>
    [...undanganKeys.all, 'canals', filter] as const,
  canal: (orderNo: string) => [...undanganKeys.all, 'canal', orderNo] as const,
};

export function useAois(page = 1, limit = 20): UseQueryResult<api.AoiListResponse> {
  return useQuery({
    queryKey: undanganKeys.aoiList(page, limit),
    queryFn: () => api.listAois(page, limit),
    staleTime: 30_000,
  });
}

export function useAoi(id: Id | undefined): UseQueryResult<api.AoiDetail> {
  return useQuery({
    queryKey: undanganKeys.aoi(id ?? ''),
    queryFn: () => api.getAoi(id!),
    enabled: !!id,
  });
}

export function useCanals(filter: api.CanalFilter): UseQueryResult<api.CanalListResponse> {
  return useQuery({
    queryKey: undanganKeys.canalList(filter),
    queryFn: () => api.listCanals(filter),
    staleTime: 30_000,
  });
}

export function useCanal(orderNo: string | undefined): UseQueryResult<api.CanalDetail> {
  return useQuery({
    queryKey: undanganKeys.canal(orderNo ?? ''),
    queryFn: () => api.getCanal(orderNo!),
    enabled: !!orderNo,
  });
}

export function useImportAoi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.importAoi(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: undanganKeys.all });
    },
  });
}
