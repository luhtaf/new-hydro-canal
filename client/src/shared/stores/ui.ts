/**
 * UI store — state efemeral shell: overlay (⌘K, sync drawer, tour), sidebar mobile,
 * konektivitas (online/offline toggle demo), queue badge, dan toast stack.
 *
 * Bukan server state (itu TanStack Query) & bukan data offline (itu PouchDB).
 * Ini murni UI chrome. Demo ref: app.js `state` (subset shell) + `refreshConnectivityUI`.
 *
 * Konektivitas: di produksi pakai navigator.onLine + listener; di shell ini bisa
 * di-toggle manual (demo touch "offline simulator"). Queue di-derive dari PouchDB
 * outbox saat slice sync siap; untuk sekarang counter sederhana.
 */
import { create } from 'zustand';

/** 1 item antrian sinkronisasi (demo touch: sync drawer). */
export interface QueueItem {
  id: string;
  kind: string;
  label: string;
  size: string;
  when: string;
}

/** 1 toast (demo touch: slide-up auto-dismiss). */
export interface ToastItem {
  id: string;
  msg: string;
  kind: 'ok' | 'warn' | 'err' | 'info';
}

let toastSeq = 0;
const TOAST_TTL = 2800; // ms — sinkron dengan demo.

interface UiStore {
  // overlays
  cmdkOpen: boolean;
  syncDrawerOpen: boolean;
  sidebarOpen: boolean; // mobile drawer
  openCmdk: () => void;
  closeCmdk: () => void;
  toggleCmdk: () => void;
  openSyncDrawer: () => void;
  closeSyncDrawer: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // konektivitas + queue
  online: boolean;
  setOnline: (v: boolean) => void;
  toggleOnline: () => void;
  queue: QueueItem[];
  enqueue: (item: Omit<QueueItem, 'id'>) => void;
  dequeue: (id: string) => void;
  clearQueue: () => void;

  // toast
  toasts: ToastItem[];
  toast: (msg: string, kind?: ToastItem['kind']) => void;
  dismissToast: (id: string) => void;
}

export const useUi = create<UiStore>((set, get) => ({
  cmdkOpen: false,
  syncDrawerOpen: false,
  sidebarOpen: false,
  openCmdk: () => set({ cmdkOpen: true }),
  closeCmdk: () => set({ cmdkOpen: false }),
  toggleCmdk: () => set((s) => ({ cmdkOpen: !s.cmdkOpen })),
  openSyncDrawer: () => set({ syncDrawerOpen: true }),
  closeSyncDrawer: () => set({ syncDrawerOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (online) => set({ online }),
  toggleOnline: () => set((s) => ({ online: !s.online })),
  queue: [],
  enqueue: (item) =>
    set((s) => ({
      queue: [
        ...s.queue,
        { ...item, id: 'q' + Math.random().toString(36).slice(2, 8) },
      ],
    })),
  dequeue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
  clearQueue: () => set({ queue: [] }),

  toasts: [],
  toast: (msg, kind = 'info') => {
    const id = 't' + ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => get().dismissToast(id), TOAST_TTL);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Helper imperatif (non-hook) untuk dipanggil dari event handler/util. */
export const toast = (msg: string, kind?: ToastItem['kind']) =>
  useUi.getState().toast(msg, kind);
