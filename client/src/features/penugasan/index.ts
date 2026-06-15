/**
 * Barrel publik slice `penugasan`. Shell/router impor dari sini.
 * Permukaan kontrak: route config + page components (default + named) + hooks/api.
 */
export { penugasanRoutes } from './routes.js';

// Pages — default export (path route disebut di field wiring StructuredOutput).
export { default as PenugasanList } from './PenugasanList.js';
export { default as PenugasanDetail } from './PenugasanDetail.js';

// Hooks + api (dipakai admin assign UI / dashboard kalau perlu).
export * as penugasanApi from './api.js';
export {
  useMinePenugasan,
  usePenugasanDetail,
  useAssignCanals,
  useUnassignCanals,
  penugasanKeys,
} from './hooks.js';
