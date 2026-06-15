/**
 * Barrel publik slice auth. Slice lain (layout, router, sync) impor dari sini,
 * BUKAN dari file internal — supaya permukaan kontrak fitur jelas & greppable.
 */
export { LoginPage } from './LoginPage.js';
export { ProtectedRoute } from './ProtectedRoute.js';
export { RoleSwitcher } from './RoleSwitcher.js';
export { AccountSwitcher } from './AccountSwitcher.js';
export { AppLockScreen } from './AppLockScreen.js';
export { SyncBadge } from './SyncBadge.js';
export { AuthProvider } from './AuthProvider.js';

export { useAuth, useRole } from './hooks.js';
export { authApi, apiClient } from './api.js';
export type { LoginPayload, AuthProfile } from './api.js';

// Store + selector (dipakai sync engine untuk setSyncState/markEnrolled).
export {
  useAuthStore,
  selectActiveAccount,
  selectAccounts,
  selectEffectiveRole,
} from './store.js';
export type { Account, AccountSyncState, AuthStore } from './store.js';

// Lock store (dipakai settings untuk toggle gembok/biometrik).
export {
  useLockStore,
  bootstrapLock,
  biometricAvailable,
} from './lock.js';
export type { LockStore } from './lock.js';
