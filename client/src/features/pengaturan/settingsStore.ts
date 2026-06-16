/**
 * settingsStore — preferensi app non-threshold yang dimiliki slice [pengaturan].
 *
 * Saat ini cuma `autoSync` (kirim antrian otomatis tiap 30 detik saat online).
 * Persist localStorage (mirip theme/lock store). Threshold TIDAK di sini — itu
 * server-state (singleton Pengukurans) di api.ts/hooks.ts. App-lock juga BUKAN
 * di sini — itu milik [auth] (`useLockStore`), slice ini cuma mengonsumsinya.
 *
 * Demo ref: `state.settings.autoSync` (toggle-switch data-toggle-setting).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  /** Sinkron otomatis saat online (push antrian tiap ~30s). Default ON. */
  autoSync: boolean;
}

interface SettingsActions {
  setAutoSync: (on: boolean) => void;
  toggleAutoSync: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      autoSync: true,
      setAutoSync: (on) => set({ autoSync: on }),
      toggleAutoSync: () => set({ autoSync: !get().autoSync }),
    }),
    {
      name: 'hydrocanal-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
