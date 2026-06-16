/**
 * Barrel publik slice lapangan-parameter. Slice lain (router/layout) impor
 * `lapanganParameterRoutes` dari sini, bukan reach ke file dalam.
 */
export { lapanganParameterRoutes } from './routes.js';
export { ParameterForm, default } from './ParameterForm.js';
export {
  parameterSchema,
  softWarnings,
  maxThreeDecimals,
  DEFAULT_OPERATION_NO,
  type ParameterFormValues,
  type ParameterFormOutput,
} from './schema.js';
export {
  useAssignment,
  useParameterDraft,
  useSaveParameter,
  canalDocId,
  parameterDocId,
  type AssignmentPayload,
  type ParameterDraftPayload,
} from './hooks.js';
