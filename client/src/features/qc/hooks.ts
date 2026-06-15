/**
 * TanStack Query hooks slice `qc`.
 *
 * `useQcOutputs` — daftar kartu output (server-state, TanStack Query).
 * `useExport` — mutation export single-format (download via Blob); on success/error
 * memunculkan toast. `useExportBulk` — bulk ZIP. Setelah export sukses, invalidate
 * daftar output supaya status Done/qcOutput ke-refresh.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { toast } from '../../shared/stores/ui.js';
import * as api from './api.js';
import type { ExportFormat, QcOutputCard } from './api.js';

export const qcKeys = {
  all: ['qc'] as const,
  outputs: () => [...qcKeys.all, 'outputs'] as const,
};

export function useQcOutputs(): UseQueryResult<QcOutputCard[]> {
  return useQuery({ queryKey: qcKeys.outputs(), queryFn: api.listOutputs });
}

const FORMAT_LABEL: Record<ExportFormat, string> = {
  png: 'PNG chart',
  txt: 'TXT',
  'page2-xlsx': 'Excel Page 2',
  'page3-xlsx': 'Excel Page 3',
  'pat-csv': 'Request PAT (CSV)',
  zpm32: 'ZPM32',
};

export function useExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ canalId, format }: { canalId: string; format: ExportFormat }) =>
      api.exportSingle(canalId, format),
    onSuccess: (filename, { format }) => {
      toast(`${FORMAT_LABEL[format]} di-generate & di-download: ${filename}`, 'ok');
      void qc.invalidateQueries({ queryKey: qcKeys.outputs() });
    },
    onError: (_e, { format }) =>
      toast(`Gagal export ${FORMAT_LABEL[format]} — cek koneksi / data canal`, 'err'),
  });
}

export function useExportBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ canalIds, formats }: { canalIds: string[]; formats: ExportFormat[] }) =>
      api.exportBulk(canalIds, formats),
    onSuccess: (filename) => {
      toast(`Bulk ZIP di-generate & di-download: ${filename}`, 'ok');
      void qc.invalidateQueries({ queryKey: qcKeys.outputs() });
    },
    onError: () => toast('Gagal export bulk — cek archiver terpasang di server', 'err'),
  });
}

export { FORMAT_LABEL };
