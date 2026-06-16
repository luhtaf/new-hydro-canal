/**
 * API client slice `users` — manajemen akun (admin-only). Bungkus transport ke
 * BE `/users/*` (slice [user] server). Server membungkus respons `{ data: ... }`.
 *
 * Reuse axios instance dari slice [auth] (`apiClient`) supaya interceptor
 * 401→app-lock konsisten (spec § C). JANGAN bikin instance baru.
 */
import { apiClient } from '../auth/api.js';
import type { Id, Role, UsvCode, UserStatus } from '../../shared/types.js';

/** Bentuk akun yang dikembalikan server (TANPA pinHash). */
export interface ManagedUser {
  id: Id;
  name: string;
  email: string;
  initials: string;
  role: Role;
  usv: UsvCode | null;
  status: UserStatus;
  tokenVersion: number;
  revoked: boolean;
  lastActiveAt: string;
  createdAt: string;
  productivityCache?: { kanal30d: number; passRate: number; reqcRate: number };
}

export interface CreateUserBody {
  name: string;
  email: string;
  pin: string;
  role: Role;
  usv?: UsvCode | null;
  status?: UserStatus;
  initials?: string;
}

export type UpdateUserBody = Partial<Omit<CreateUserBody, 'pin'>>;

/** GET /users → daftar akun aktif (revoked disembunyikan server default). */
export async function listUsers(): Promise<ManagedUser[]> {
  const { data } = await apiClient.get<{ data: ManagedUser[] }>('/users');
  return data.data;
}

/** POST /users → buat akun baru. */
export async function createUser(body: CreateUserBody): Promise<ManagedUser> {
  const { data } = await apiClient.post<{ data: ManagedUser }>('/users', body);
  return data.data;
}

/** PATCH /users/:id → update field akun (tanpa PIN). */
export async function updateUser(id: Id, body: UpdateUserBody): Promise<ManagedUser> {
  const { data } = await apiClient.patch<{ data: ManagedUser }>(`/users/${id}`, body);
  return data.data;
}

/** DELETE /users/:id → soft delete (server set revoked + naik tokenVersion). */
export async function deleteUser(id: Id): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

/** POST /users/:id/reset-pin → admin reset PIN akun. */
export async function resetPin(id: Id, pin: string): Promise<void> {
  await apiClient.post(`/users/${id}/reset-pin`, { pin });
}
