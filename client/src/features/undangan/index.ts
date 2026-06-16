/**
 * Barrel publik slice `undangan`. Slice lain (router/penugasan/qc) impor dari sini.
 * Permukaan kontrak: route config + page components + komponen reusable + hooks.
 */
export { undanganRoutes } from './routes.js';

// Pages (default export; bisa juga di-mount langsung).
export { UndanganList } from './UndanganList.js';
export { UndanganDetail } from './UndanganDetail.js';
export { UndanganBaru } from './UndanganBaru.js';

// Komponen reusable (dipakai penugasan/qc: badge deadline & status, header AOI).
export { DeadlineBadge, StatusBadge } from './components/badges.js';
export { AoiHeaderCards } from './components/AoiHeaderCards.js';
export { ImportExcelDialog } from './components/ImportExcelDialog.js';

// Hooks + api (penugasan/peta/reports baca canal/aoi dari sini).
export {
  useAois,
  useAoi,
  useCanals,
  useCanal,
  useImportAoi,
  undanganKeys,
} from './hooks.js';
export * as undanganApi from './api.js';
