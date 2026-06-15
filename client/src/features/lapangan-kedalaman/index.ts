/**
 * Barrel publik slice `lapangan-kedalaman`. Slice lain (router/layout) impor dari sini.
 * Permukaan kontrak: route config + page + helper depth doc.
 */
export { lapanganKedalamanRoutes } from './routes.js';
export { KedalamanInput } from './KedalamanInput.js';

// Helper PouchDB doc kedalaman (dipakai [sync] projection & [qc] kalau perlu baca).
export {
  writeDepth,
  displayedOf,
  rawDepthFromFinal,
  statusOf,
  depthDocId,
  DEPTH_PREFIX,
  type DepthPayload,
} from './depthDoc.js';
export { useDepthRows } from './useDepthRows.js';
