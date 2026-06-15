/**
 * Barrel publik slice `pengaturan`. Router meng-impor `pengaturanRoutes` dari sini.
 */
export { pengaturanRoutes } from './routes.js';
export { default as PengaturanPage } from './PengaturanPage.js';

// Preferensi app (autoSync) — dipakai [fe-sync] untuk memutuskan auto-push.
export { useSettingsStore } from './settingsStore.js';

// Threshold helpers (mapper legacy ⇄ flat + default) — bisa dipakai slice lain
// yang butuh baca threshold server (mis. [qc] saat menggantikan useThreshold default).
export {
  DEFAULT_THRESHOLD,
  fetchThreshold,
  saveThreshold,
  toThreshold,
  toPengukuran,
} from './api.js';
export { useThresholdQuery, useThresholdEditor, useLocalStats, useLocalActions } from './hooks.js';
