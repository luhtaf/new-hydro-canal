/**
 * Barrel publik slice `notifikasi`. Router meng-impor `notifikasiRoutes` dari sini.
 */
export { notifikasiRoutes } from './routes.js';
export { default as NotifInbox } from './NotifInbox.js';
export { NotifBadge } from './NotifBadge.js';

// Hooks/selector dipakai ulang (mis. shell kelak konsumsi unread langsung).
export {
  useInbox,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  notifKeys,
} from './hooks.js';
export { relativeTime } from './relativeTime.js';
export type { InboxResponse } from './api.js';
