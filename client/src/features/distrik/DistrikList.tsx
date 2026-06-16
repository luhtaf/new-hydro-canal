/**
 * DistrikList (`/distrik`) — master distrik & region (admin-only). Port demo
 * `view-distrik`: distrik dikelompokkan per Region (card per region), tiap baris
 * = kode 4-char (mono badge brand) + nama distrik + menu aksi (edit / hapus).
 * Tombol "Tambah distrik" → DistrikForm modal. Banner info konflik kode antar-region.
 *
 * Default export → diwire di router sebagai route `/distrik` (requireRole admin).
 * Visual premium: card grid 3-col, palet restrained + aksen brand, Lucide 1 weight.
 */
import { useMemo, useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import { confirmDialog } from '../../shared/layout/confirm.js';
import { toast } from '../../shared/stores/ui.js';
import { useDistricts, useDeleteDistrict, groupByRegion } from './hooks.js';
import { DistrikForm } from './DistrikForm.js';
import { DistrikRow } from './components/DistrikRow.js';
import type { Distrik } from './api.js';

export default function DistrikList() {
  const { data: districts = [], isLoading, isError, refetch } = useDistricts();
  const del = useDeleteDistrict();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Distrik | null>(null);

  const groups = useMemo(() => groupByRegion(districts), [districts]);

  const openAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (d: Distrik) => {
    setEditTarget(d);
    setFormOpen(true);
  };

  const onDelete = (d: Distrik) => {
    confirmDialog({
      title: 'Hapus distrik?',
      body: `Distrik ${d.name} (${d.kode}) akan dihapus. Pastikan tidak ada undangan/penugasan aktif yang memakai distrik ini.`,
      confirm: 'Hapus',
      danger: true,
      onConfirm: () =>
        del.mutate(d.id, {
          onSuccess: () => toast(`${d.name} dihapus`, 'ok'),
          onError: () => toast('Gagal menghapus distrik', 'err'),
        }),
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distrik &amp; Region</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Distrik dikelompokkan per region kontraktor.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" className="h-4 w-4" />
          Tambah distrik
        </button>
      </header>

      {/* Loading */}
      {isLoading && <SkeletonGrid />}

      {/* Error */}
      {!isLoading && isError && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icon name="alert-triangle" className="h-7 w-7" />
            </div>
            <div className="font-semibold">Gagal memuat distrik</div>
            <button className="btn btn-ghost mt-3" onClick={() => refetch()}>
              <Icon name="refresh-cw" className="h-4 w-4" />
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && districts.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icon name="map-pinned" className="h-7 w-7" />
            </div>
            <div className="font-semibold">Belum ada distrik</div>
            <div className="mt-1 text-sm text-slate-500">
              Tambah distrik pertama untuk mulai mengelompokkan per region.
            </div>
            <button className="btn btn-primary mt-3" onClick={openAdd}>
              <Icon name="plus" className="h-4 w-4" />
              Tambah distrik
            </button>
          </div>
        </div>
      )}

      {/* Card per region */}
      {!isLoading && !isError && districts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map((g) => (
            <div
              key={g.region}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="border-b border-slate-100 p-4 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">{g.region}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Region · {g.districts.length}{' '}
                  {g.districts.length === 1 ? 'distrik' : 'distrik'}
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {g.districts.map((d) => (
                  <DistrikRow
                    key={d.id}
                    distrik={d}
                    onEdit={() => openEdit(d)}
                    onDelete={() => onDelete(d)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner info konflik kode antar-region (port demo) */}
      {!isLoading && !isError && districts.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-amber-900 dark:text-amber-200">
            Distrik dengan kode sama bisa muncul di region berbeda. Selalu pilih region
            dulu agar tidak konflik saat assign undangan.
          </div>
        </div>
      )}

      {/* Modal tambah/edit */}
      <DistrikForm open={formOpen} distrik={editTarget} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="border-b border-slate-100 p-4 dark:border-slate-700">
            <div className="h-4 w-40 rounded bg-slate-100 shimmer dark:bg-slate-700" />
            <div className="mt-2 h-2.5 w-24 rounded bg-slate-100 shimmer dark:bg-slate-700" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-10 rounded bg-slate-100 shimmer dark:bg-slate-700" />
                <div className="h-3 w-28 rounded bg-slate-100 shimmer dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
