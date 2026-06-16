/**
 * API client slice `notifikasi` — inbox notif per user (PLAN-BE § Notifications).
 * Reuse `apiClient` axios dari slice auth (withCredentials + interceptor 401).
 *
 * Endpoint:
 *   GET  /notifications/mine        inbox user sesi { items, unread }
 *   POST /notifications/:id/read    tandai 1 dibaca → notif ter-update
 *   POST /notifications/read-all    tandai semua dibaca → { updated }
 */
import { apiClient } from '../auth/api.js';
import type { Notification } from '../../shared/types.js';

/** Respons GET /notifications/mine (mirror server `InboxResult`). */
export interface InboxResponse {
  items: Notification[];
  unread: number;
}

export async function listMine(): Promise<InboxResponse> {
  const { data } = await apiClient.get<InboxResponse>('/notifications/mine');
  return data;
}

export async function markRead(id: string): Promise<Notification> {
  const { data } = await apiClient.post<Notification>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<{ updated: number }>(
    '/notifications/read-all',
  );
  return data;
}
