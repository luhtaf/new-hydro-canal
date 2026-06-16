/**
 * TanStack Query hooks slice `distrik` (admin CRUD master distrik & region online).
 *
 * Master distrik = jalur admin online (bukan offline-first lapangan) → server-state
 * pakai TanStack Query langsung ke API, BUKAN PouchDB. Mutasi invalidate list.
 *
 * Query key konvensi: ['districts', <scope>].
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';
import type { Distrik, DistrikFormValues } from './api.js';
import type { Id } from '../../shared/types.js';

export const districtKeys = {
  all: ['districts'] as const,
  list: () => [...districtKeys.all, 'list'] as const,
};

export function useDistricts(): UseQueryResult<Distrik[]> {
  return useQuery({
    queryKey: districtKeys.list(),
    queryFn: api.listDistricts,
    staleTime: 30_000,
  });
}

export function useCreateDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DistrikFormValues) => api.createDistrict(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: districtKeys.list() }),
  });
}

export function useUpdateDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: Id; values: DistrikFormValues }) =>
      api.updateDistrict(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: districtKeys.list() }),
  });
}

export function useDeleteDistrict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => api.deleteDistrict(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: districtKeys.list() }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Derivasi: kelompokkan distrik per Region (port demo view-distrik: card/region)
// ─────────────────────────────────────────────────────────────────────────────

const TANPA_REGION = 'Tanpa region';

export interface RegionGroup {
  /** Label region (nama kontraktor/area) atau "Tanpa region". */
  region: string;
  /** Distrik di region ini, urut by kode. */
  districts: Distrik[];
}

/**
 * Group daftar distrik per `regionName`. Region kosong/null → bucket "Tanpa region"
 * yang selalu diletakkan paling akhir. Region lain urut alfabet, distrik urut by kode.
 */
export function groupByRegion(districts: Distrik[]): RegionGroup[] {
  const buckets = new Map<string, Distrik[]>();
  for (const d of districts) {
    const key = d.regionName?.trim() || TANPA_REGION;
    const arr = buckets.get(key) ?? [];
    arr.push(d);
    buckets.set(key, arr);
  }

  const groups: RegionGroup[] = [...buckets.entries()].map(([region, list]) => ({
    region,
    districts: [...list].sort((a, b) => a.kode.localeCompare(b.kode)),
  }));

  groups.sort((a, b) => {
    if (a.region === TANPA_REGION) return 1;
    if (b.region === TANPA_REGION) return -1;
    return a.region.localeCompare(b.region);
  });

  return groups;
}
