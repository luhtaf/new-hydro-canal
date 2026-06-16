/**
 * Barrel publik slice `users` (admin manajemen akun). Router meng-import
 * `usersRoutes`; slice lain (mis. [reports]) boleh pakai hooks/tipe akun dari sini.
 */
export { usersRoutes } from './routes.js';

// Page (mount langsung kalau perlu tanpa lazy).
export { default as UsersList } from './UsersList.js';
export { UserForm } from './UserForm.js';

// Hooks + tipe akun (dipakai-ulang slice lain: reports produktivitas, dll).
export {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPin,
  deriveUsersKpi,
  userKeys,
  type UsersKpi,
} from './hooks.js';
export * as usersApi from './api.js';
export type { ManagedUser, CreateUserBody, UpdateUserBody } from './api.js';
