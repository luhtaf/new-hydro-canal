/**
 * TanStack Query hooks slice `users` (admin CRUD akun online).
 *
 * Manajemen akun = jalur admin online (bukan offline-first lapangan) → server-state
 * pakai TanStack Query langsung ke API, BUKAN PouchDB. Mutasi invalidate list.
 *
 * Query key konvensi: ['users', <scope>].
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as api from './api.js';
import type { ManagedUser, CreateUserBody, UpdateUserBody } from './api.js';
import type { Id } from '../../shared/types.js';

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
};

export function useUsers(): UseQueryResult<ManagedUser[]> {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: api.listUsers,
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserBody) => api.createUser(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: Id; body: UpdateUserBody }) =>
      api.updateUser(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => api.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

export function useResetPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: Id; pin: string }) => api.resetPin(id, pin),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Derivasi KPI untuk header (port demo stat-card view-users)
// ─────────────────────────────────────────────────────────────────────────────

export interface UsersKpi {
  totalOperator: number;
  operatorAktif: number;
  operatorCuti: number;
  totalAdmin: number;
  usvTerpasang: number;
  avgProduktivitas: number;
}

/** Hitung KPI ringkas dari daftar akun (memoize di pemanggil kalau perlu). */
export function deriveUsersKpi(users: ManagedUser[]): UsersKpi {
  const operators = users.filter((u) => u.role === 'operator');
  const admins = users.filter((u) => u.role === 'admin');
  const usvSet = new Set(operators.map((u) => u.usv).filter(Boolean));
  const kanal = operators
    .map((u) => u.productivityCache?.kanal30d ?? 0)
    .filter((n) => n > 0);
  const avg =
    kanal.length === 0
      ? 0
      : Math.round((kanal.reduce((a, b) => a + b, 0) / kanal.length) * 10) / 10;
  return {
    totalOperator: operators.length,
    operatorAktif: operators.filter((u) => u.status === 'aktif').length,
    operatorCuti: operators.filter((u) => u.status === 'cuti').length,
    totalAdmin: admins.length,
    usvTerpasang: usvSet.size,
    avgProduktivitas: avg,
  };
}
