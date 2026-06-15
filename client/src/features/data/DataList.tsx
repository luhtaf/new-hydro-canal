/**
 * DataList (`/admin/data/:id`) — port `Data.js` existing.
 * List canal_data segment di bawah 1 MainData. Fitur kunci yang di-port:
 *  - Excel page 3 BULK import (kedalaman) → POST /detaildata/:segmentId (array)
 *  - Checkbox SHIFT-SELECT range (port selectRange) + bulk delete
 *  - Link ke Add/Edit segment, Detail (kedalaman), Chart, Export PNG bulk
 *
 * Touches demo: drop zone CSV/Excel (dashed + dragover glow), toast feedback +
 * "masuk antrian sync", confirm dialog destruktif.
 */
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { confirmDialog } from '../../shared/layout/confirm.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, EmptyState, ErrorState } from './components/states.js';
import {
  useMainData,
  useAddDetail,
  useDeleteSegment,
} from './hooks.js';
import { exportAllChart } from './api.js';
import { parsePage3 } from './excelPage3.js';
import { useShiftSelect } from './useShiftSelect.js';
import type { CanalDataSegment } from '../../shared/types.js';

export function DataList() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useMainData(id);
  const delSeg = useDeleteSegment(id);

  const segments: CanalDataSegment[] = data?.canal_data ?? [];
  const ids = segments.map((s) => s._id ?? '');
  const sel = useShiftSelect(ids);

  // ── Bulk Excel page 3 import ──────────────────────────────────────────────
  const [importTargetSeg, setImportTargetSeg] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addDetail = useAddDetail(importTargetSeg);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!importTargetSeg) {
      toast('Pilih segmen tujuan import dulu', 'warn');
      return;
    }
    let total = 0;
    let skipped = 0;
    for (const file of Array.from(files)) {
      try {
        const res = await parsePage3(file);
        if (res.points.length > 0) {
          await addDetail.mutateAsync(res.points);
          total += res.points.length;
        }
        skipped += res.skipped;
      } catch {
        toast(`Gagal parse ${file.name}`, 'err');
      }
    }
    if (total > 0) {
      toast(
        `${total} titik diimport${skipped ? `, ${skipped} dilewati` : ''} · masuk antrian sync`,
        'ok',
      );
    } else {
      toast('Tidak ada titik valid di file', 'warn');
    }
  };

  // ── Bulk delete (shift-select) ────────────────────────────────────────────
  const bulkDelete = () => {
    confirmDialog({
      title: `Hapus ${sel.count} segmen?`,
      body: 'Segmen terpilih beserta titik kedalamannya akan dihapus permanen.',
      confirm: 'Hapus',
      danger: true,
      onConfirm: async () => {
        for (const sid of sel.selected) {
          await delSeg.mutateAsync(sid).catch(() => {});
        }
        toast(`${sel.count} segmen dihapus`, 'ok');
        sel.clear();
      },
    });
  };

  // ── Export PNG bulk ───────────────────────────────────────────────────────
  const exportPng = async () => {
    try {
      const blob = await exportAllChart(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.batang_canal_id ?? 'chart'}-charts.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export chart PNG diunduh', 'ok');
    } catch {
      toast('Gagal export chart', 'err');
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Segmen Canal">
        <TableSkeleton cols={6} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Segmen Canal">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Segmen Canal"
      subtitle={
        <span className="font-mono text-slate-400">{data.batang_canal_id}</span>
      }
      actions={
        <>
          <button className="btn btn-ghost" onClick={exportPng}>
            <Icon name="line-chart" className="h-4 w-4" />
            Export PNG
          </button>
          <Link to={`/admin/data/${id}/add`} className="btn btn-primary">
            <Icon name="plus-circle" className="h-4 w-4" />
            Tambah segmen
          </Link>
        </>
      }
    >
      {/* Drop zone Excel page 3 */}
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-7 text-center transition ${
              dragOver
                ? 'border-brand-400 bg-brand-50 scale-[1.01] shadow-soft'
                : 'border-slate-300 bg-white hover:border-brand-300'
            }`}
          >
            <Icon
              name="cloud-upload"
              className="mx-auto h-7 w-7 text-brand-500 mb-2"
            />
            <p className="text-sm font-medium text-slate-700">
              Tarik file Excel/CSV page 3 (kedalaman) ke sini
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              atau klik untuk pilih file · bulk import banyak titik sekaligus
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Segmen tujuan import
          </label>
          <select
            className="input"
            value={importTargetSeg}
            onChange={(e) => setImportTargetSeg(e.target.value)}
          >
            <option value="">— pilih segmen —</option>
            {segments.map((s) => (
              <option key={s._id} value={s._id}>
                {s.canal_id} (STA {s.start}–{s.end})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {sel.count > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-200 px-4 py-2.5 scale-in">
          <span className="text-sm font-medium text-brand-800">
            {sel.count} segmen dipilih
          </span>
          <button className="btn btn-danger input-sm" onClick={bulkDelete}>
            <Icon name="x" className="h-3.5 w-3.5" />
            Hapus terpilih
          </button>
          <button className="btn btn-ghost input-sm" onClick={sel.clear}>
            Batal pilih
          </button>
        </div>
      )}

      {segments.length === 0 ? (
        <EmptyState
          icon="ruler"
          heading="Belum ada segmen"
          sub="Tambah segmen canal lalu import kedalaman lewat Excel page 3."
          cta={
            <Link to={`/admin/data/${id}/add`} className="btn btn-primary">
              <Icon name="plus-circle" className="h-4 w-4" />
              Tambah segmen
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={sel.allChecked}
                    onChange={sel.toggleAll}
                    aria-label="Pilih semua"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Canal ID</th>
                <th className="px-4 py-3 font-semibold">STA</th>
                <th className="px-4 py-3 font-semibold">Panjang</th>
                <th className="px-4 py-3 font-semibold">Titik</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.map((s, i) => (
                <tr key={s._id} className="table-row transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={sel.isSelected(s._id ?? '')}
                      onClick={(e) =>
                        sel.toggle(i, s._id ?? '', (e as React.MouseEvent).shiftKey)
                      }
                      onChange={() => {}}
                      aria-label={`Pilih ${s.canal_id}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                    {s.canal_id}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.start}–{s.end}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.canal_length} m
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.data?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/admin/data/${s._id}/detail`}
                        className="btn btn-ghost input-sm"
                      >
                        Kedalaman
                      </Link>
                      <Link
                        to={`/admin/data/${s._id}/chart`}
                        className="btn btn-ghost input-sm"
                      >
                        <Icon name="line-chart" className="h-3.5 w-3.5" />
                        Chart
                      </Link>
                      <button
                        className="btn btn-ghost input-sm"
                        onClick={() => nav(`/admin/data/${s._id}/edit`)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

export default DataList;
