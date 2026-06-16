/**
 * Barrel publik slice `distrik` (admin master distrik & region). Router meng-import
 * `distrikRoutes`; slice lain (mis. [undangan]/[penugasan] yang butuh pilih distrik)
 * boleh pakai hooks/tipe distrik dari sini.
 */
export { distrikRoutes } from './routes.js';

// Page (mount langsung kalau perlu tanpa lazy).
export { default as DistrikList } from './DistrikList.js';
export { DistrikForm } from './DistrikForm.js';

// Hooks + tipe distrik (dipakai-ulang slice lain: undangan/penugasan pilih distrik).
export {
  useDistricts,
  useCreateDistrict,
  useUpdateDistrict,
  useDeleteDistrict,
  groupByRegion,
  districtKeys,
  type RegionGroup,
} from './hooks.js';
export * as distrikApi from './api.js';
export type { Distrik, DistrikFormValues } from './api.js';
