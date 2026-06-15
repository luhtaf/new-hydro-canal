/**
 * TanStack Query hooks slice `data` (port existing admin CRUD).
 *
 * Catatan arsitektur: route `/admin/*` = jalur CRUD admin online (PLAN-FE: "fallback
 * CRUD untuk admin saat ada masalah data"). Beda dgn flow lapangan operator yang
 * offline-first lewat PouchDB (slice sync). Karena itu di sini server-state pakai
 * TanStack Query langsung ke API — bukan PouchDB.
 *
 * Query key konvensi: ['data', <scope>, <id?>] supaya invalidasi granular.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';
import type {
  Data,
  CanalDataSegment,
  DepthPoint,
  Id,
} from '../../shared/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────

export const dataKeys = {
  all: ['data'] as const,
  mainList: () => [...dataKeys.all, 'main', 'list'] as const,
  main: (id: Id) => [...dataKeys.all, 'main', id] as const,
  segment: (id: Id) => [...dataKeys.all, 'segment', id] as const,
  segmentChart: (id: Id) => [...dataKeys.all, 'segment', id, 'chart'] as const,
  detail: (id: Id) => [...dataKeys.all, 'detail', id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// MainData
// ─────────────────────────────────────────────────────────────────────────────

export function useMainDataList(): UseQueryResult<Data[]> {
  return useQuery({ queryKey: dataKeys.mainList(), queryFn: api.listMainData });
}

export function useMainData(id: Id | undefined): UseQueryResult<Data> {
  return useQuery({
    queryKey: dataKeys.main(id ?? ''),
    queryFn: () => api.getMainData(id!),
    enabled: !!id,
  });
}

export function useCreateMainData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Pick<Data, 'batang_canal_id'> & Partial<Data>) =>
      api.createMainData(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: dataKeys.mainList() }),
  });
}

export function useUpdateMainData(id: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Data>) => api.updateMainData(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dataKeys.main(id) });
      qc.invalidateQueries({ queryKey: dataKeys.mainList() });
    },
  });
}

export function useDeleteMainData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => api.deleteMainData(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: dataKeys.mainList() }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Segment (canal_data)
// ─────────────────────────────────────────────────────────────────────────────

export function useSegment(id: Id | undefined): UseQueryResult<CanalDataSegment> {
  return useQuery({
    queryKey: dataKeys.segment(id ?? ''),
    queryFn: () => api.getSegment(id!),
    enabled: !!id,
  });
}

export function useSegmentChart(id: Id | undefined) {
  return useQuery({
    queryKey: dataKeys.segmentChart(id ?? ''),
    queryFn: () => api.getSegmentChart(id!),
    enabled: !!id,
  });
}

export function useAddSegment(mainDataId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CanalDataSegment> | Partial<CanalDataSegment>[]) =>
      api.addSegment(mainDataId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: dataKeys.main(mainDataId) }),
  });
}

export function useUpdateSegment(id: Id, mainDataId?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CanalDataSegment>) => api.updateSegment(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dataKeys.segment(id) });
      if (mainDataId) qc.invalidateQueries({ queryKey: dataKeys.main(mainDataId) });
    },
  });
}

export function useDeleteSegment(mainDataId?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => api.deleteSegment(id),
    onSuccess: () => {
      if (mainDataId) qc.invalidateQueries({ queryKey: dataKeys.main(mainDataId) });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DetailData (depth point)
// ─────────────────────────────────────────────────────────────────────────────

export function useDetail(id: Id | undefined): UseQueryResult<DepthPoint> {
  return useQuery({
    queryKey: dataKeys.detail(id ?? ''),
    queryFn: () => api.getDetail(id!),
    enabled: !!id,
  });
}

export function useAddDetail(segmentId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DepthPoint> | Partial<DepthPoint>[]) =>
      api.addDetail(segmentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dataKeys.segment(segmentId) });
      qc.invalidateQueries({ queryKey: dataKeys.segmentChart(segmentId) });
    },
  });
}

export function useUpdateDetail(id: Id, segmentId?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<DepthPoint>) => api.updateDetail(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dataKeys.detail(id) });
      if (segmentId) {
        qc.invalidateQueries({ queryKey: dataKeys.segment(segmentId) });
        qc.invalidateQueries({ queryKey: dataKeys.segmentChart(segmentId) });
      }
    },
  });
}

export function useDeleteDetail(segmentId?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => api.deleteDetail(id),
    onSuccess: () => {
      if (segmentId) {
        qc.invalidateQueries({ queryKey: dataKeys.segment(segmentId) });
        qc.invalidateQueries({ queryKey: dataKeys.segmentChart(segmentId) });
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Drag-edit chart save (port PATCH /updatechartdata/:id)
// ─────────────────────────────────────────────────────────────────────────────

export function useSaveDragEdit(segmentId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: api.DragSaveBody) => api.saveDragEdit(segmentId, body),
    // Sengaja TIDAK invalidate segmentChart di sini: drag-edit meng-update UI
    // optimistik (re-color bar lokal); invalidate hanya saat user reload/leave.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dataKeys.segment(segmentId) });
    },
  });
}
