/**
 * QcProcessing (`/qc`) — port demo `view-qc` + handleExport ke React, data nyata.
 *
 * Layout (PLAN-FE "QC Processing"):
 *  - hero: deskripsi engine + versi (port demo gradient card).
 *  - grid kartu output: mini chart kedalaman + stat pass/tol/fail + link sumber
 *    (order no / canalId) + tombol export per format (TXT/PNG/Excel2&3/PAT/ZPM32).
 *  - panel bulk export: pilih format → export semua canal terpilih jadi ZIP.
 *
 * Download via Blob (slice api `downloadBlob`). Demo touches dipertahankan: badge
 * status warna, toast pada export, link sumber, hover lift, empty/loading state.
 *
 * Default export (kontrak router): di-mount di route path `/qc`.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { MiniDepthChart } from './MiniDepthChart.js';
import { useQcOutputs, useExport, useExportBulk } from './hooks.js';
import type { ExportFormat, QcOutputCard } from './api.js';

// Konfigurasi tombol export (label + icon + format).
const EXPORTS: Array<{ format: ExportFormat; label: string; icon: Parameters<typeof Icon>[0]['name']; hint: string }> = [
  { format: 'txt', label: 'TXT', icon: 'scroll-text', hint: 'Format akhir QC' },
  { format: 'png', label: 'PNG', icon: 'line-chart', hint: 'Chart server-render' },
  { format: 'page2-xlsx', label: 'Excel P2', icon: 'form-input', hint: 'Parameter' },
  { format: 'page3-xlsx', label: 'Excel P3', icon: 'ruler', hint: 'Kedalaman' },
  { format: 'pat-csv', label: 'PAT', icon: 'map-pinned', hint: 'CSV koordinat UTM' },
  { format: 'zpm32', label: 'ZPM32', icon: 'hard-drive', hint: 'Upload klien' },
];

const STATUS_BADGE: Record<QcOutputCard['status'], string> = {
  Submitted: 'bg-slate-100 text-slate-600',
  Assigned: 'bg-amber-50 text-amber-700',
  'In Progress': 'bg-brand-50 text-brand-700',
  Done: 'bg-emerald-50 text-emerald-700',
};

export default function QcProcessing() {
  const { data, isLoading, isError, refetch } = useQcOutputs();
  const exportOne = useExport();
  const exportBulk = useExportBulk();
  const [bulkFormats, setBulkFormats] = useState<ExportFormat[]>(['png', 'txt']);
  const [busy, setBusy] = useState<string | null>(null);

  const onExport = (canalId: string, format: ExportFormat) => {
    setBusy(`${canalId}:${format}`);
    exportOne.mutate({ canalId, format }, { onSettled: () => setBusy(null) });
  };

  const toggleBulkFormat = (f: ExportFormat) =>
    setBulkFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const onBulk = () => {
    const ids = (data ?? []).map((c) => c.canalId);
    if (ids.length === 0 || bulkFormats.length === 0) return;
    exportBulk.mutate({ canalIds: ids, formats: bulkFormats });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">QC Processing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Proses chart, drag-edit kedalaman, dan export TXT / Excel / PNG / PAT / ZPM32.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-ghost"
          disabled={isLoading}
        >
          <Icon name="refresh-cw" className="h-4 w-4" />
          Muat ulang
        </button>
      </header>

      {/* Hero engine card */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-brand-100 bg-white shadow-sm">
          <Icon name="line-chart" className="h-6 w-6 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900">QC Processing Engine</div>
          <div className="text-sm text-slate-600">
            Bar chart kedalaman, threshold pass/tolerance/not-pass, export PNG via server canvas.
            Status canal otomatis jadi <span className="font-semibold text-emerald-600">Done</span> saat export sukses.
          </div>
        </div>
        <div className="text-xs text-slate-400">chartjs-node-canvas · 1147×722</div>
      </div>

      {/* Grid output cards */}
      {isLoading ? (
        <OutputGridSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((card) => (
            <OutputCard
              key={card.canalId}
              card={card}
              busy={busy}
              onExport={onExport}
            />
          ))}
        </div>
      )}

      {/* Bulk export panel */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="sec-title mb-1">Export bulk</div>
        <p className="mb-4 text-xs text-slate-500">
          Pilih format lalu generate ZIP untuk semua canal di daftar
          {data ? ` (${data.length} canal)` : ''}.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((e) => {
            const active = bulkFormats.includes(e.format);
            return (
              <button
                key={e.format}
                onClick={() => toggleBulkFormat(e.format)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                aria-pressed={active}
              >
                <Icon name={e.icon} className="h-3.5 w-3.5" />
                {e.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onBulk}
          disabled={!data || data.length === 0 || bulkFormats.length === 0 || exportBulk.isPending}
          className="btn btn-primary mt-4"
        >
          <Icon name="cloud-upload" className="h-4 w-4" />
          {exportBulk.isPending ? 'Menyiapkan ZIP…' : `Export ZIP (${bulkFormats.length} format)`}
        </button>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kartu output
// ─────────────────────────────────────────────────────────────────────────────

function OutputCard({
  card,
  busy,
  onExport,
}: {
  card: QcOutputCard;
  busy: string | null;
  onExport: (canalId: string, format: ExportFormat) => void;
}) {
  const { pass, tol, fail } = card.summary;
  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="truncate font-mono text-sm font-semibold text-slate-900" title={card.qcOutput ?? card.canalCode}>
          {card.qcOutput ?? card.canalCode}
        </div>
        <span className={`badge ${STATUS_BADGE[card.status]} shrink-0`}>
          {card.requestType === 'RE-QC' ? 're-QC' : card.status === 'Done' ? 'selesai' : card.status.toLowerCase()}
        </span>
      </div>

      <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-500">
        <Icon name="git-merge" className="h-3 w-3 shrink-0" />
        Sumber:
        <Link
          to={`/undangan/${card.orderNo}`}
          className="font-semibold text-brand-600 hover:underline"
        >
          {card.orderNo}
        </Link>
        <span className="text-slate-300">·</span>
        <span className="font-mono">{card.canalCode}</span>
      </div>

      <MiniDepthChart mini={card.mini} className="h-28" />

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Stat value={pass} label="pass" tone="text-emerald-600" />
        <Stat value={tol} label="tol" tone="text-amber-600" />
        <Stat value={fail} label="fail" tone="text-rose-600" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {EXPORTS.map((e) => {
          const key = `${card.canalId}:${e.format}`;
          const isBusy = busy === key;
          return (
            <button
              key={e.format}
              onClick={() => onExport(card.canalId, e.format)}
              disabled={isBusy}
              title={`${e.label} — ${e.hint}`}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
            >
              <Icon name={isBusy ? 'refresh-cw' : e.icon} className={`h-3 w-3 ${isBusy ? 'animate-spin' : ''}`} />
              {e.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <div className={`font-semibold ${tone}`}>{value}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────────────────────

function OutputGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-3 h-8 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <Icon name="line-chart" className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-700">Belum ada output QC</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">
        Selesaikan input parameter & kedalaman di penugasan, lalu canal akan muncul di sini siap di-export.
      </p>
      <Link to="/penugasan" className="btn btn-primary mt-4">
        <Icon name="clipboard-list" className="h-4 w-4" />
        Ke penugasan saya
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-rose-200 bg-rose-50/40 py-12 text-center">
      <Icon name="alert-triangle" className="h-7 w-7 text-rose-500" />
      <p className="mt-3 text-sm font-medium text-slate-700">Gagal memuat daftar output</p>
      <button onClick={onRetry} className="btn btn-ghost mt-3">
        <Icon name="refresh-cw" className="h-4 w-4" />
        Coba lagi
      </button>
    </div>
  );
}
