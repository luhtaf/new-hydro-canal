/**
 * Barrel publik slice `qc` (FE). Router meng-import default page secara lazy:
 *   { path: 'qc', lazy: () => import('./features/qc/QcProcessing.js')
 *       .then(m => ({ Component: m.default })) }
 */
export { default as QcProcessing } from './QcProcessing.js';
export { MiniDepthChart } from './MiniDepthChart.js';
export * as qcApi from './api.js';
export { useQcOutputs, useExport, useExportBulk, qcKeys } from './hooks.js';
export type { ExportFormat, QcOutputCard } from './api.js';
