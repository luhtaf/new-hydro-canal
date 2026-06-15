/**
 * Barrel publik slice `data`. Slice lain (router/layout) impor dari sini.
 * Permukaan kontrak: route config + page components + hooks + helper drag.
 */
export { dataRoutes } from './routes.js';

// Pages (kalau perlu mount langsung tanpa lazy).
export { MainDataList } from './MainDataList.js';
export { AddMainData } from './AddMainData.js';
export { EditMainData } from './EditMainData.js';
export { DataList } from './DataList.js';
export { AddData } from './AddData.js';
export { EditData } from './EditData.js';
export { ChartData } from './ChartData.js';
export { ChartPreview } from './ChartPreview.js';
export { DetailDataList } from './DetailDataList.js';
export { AddDetailData } from './AddDetailData.js';
export { EditDetailData } from './EditDetailData.js';
export { ChartDetailData } from './ChartDetailData.js';

// Komponen yang dipakai-ulang fitur lapangan/qc (DepthChart) — slice lain impor dari sini.
export { DepthChart } from './components/DepthChart.js';

// Hooks query data (dipakai qc/penugasan kalau perlu baca segment/chart).
export * as dataApi from './api.js';
export {
  useMainDataList,
  useMainData,
  useSegment,
  useSegmentChart,
  useDetail,
  dataKeys,
} from './hooks.js';

// Helper depth bridge + threshold default (sementara, sampai slice pengukuran).
export {
  displayedDepth,
  rawFromDisplayed,
  depthClass,
  depthColor,
} from './depthMath.js';
export { useThreshold, DEFAULT_THRESHOLD } from './useThreshold.js';
