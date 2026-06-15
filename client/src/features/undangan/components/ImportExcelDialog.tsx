/**
 * ImportExcelDialog (admin) — upload Excel AOI ke POST /aoi/import.
 * Demo touch: drop-zone visual (dashed border, dragover glow) + toast feedback +
 * ringkasan hasil (imported / duplikat / error per baris). Modal via Portal.
 */
import { useRef, useState, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../shared/layout/Icon.js';
import { toast } from '../../../shared/stores/ui.js';
import { useImportAoi } from '../hooks.js';
import type { ImportResult } from '../api.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportExcelDialog({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const imp = useImportAoi();

  if (!open || typeof document === 'undefined') return null;

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast('Hanya file Excel (.xlsx/.xls)', 'err');
      return;
    }
    setResult(null);
    imp.mutate(file, {
      onSuccess: (res) => {
        setResult(res);
        const ok = res.canalCount;
        toast(
          `${ok} canal di-import${res.duplicates.length ? ` · ${res.duplicates.length} duplikat dilewati` : ''}`,
          res.errors.length ? 'warn' : 'ok',
        );
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Gagal mengimpor AOI';
        toast(msg, 'err');
      },
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    accept(e.dataTransfer.files?.[0]);
  };

  const close = () => {
    setResult(null);
    onClose();
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Import Excel AOI"
    >
      <div className="modal-card w-full max-w-lg">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name="file-spreadsheet" className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-bold text-slate-900">Import Excel AOI</div>
              <div className="mt-0.5 text-xs text-slate-500">
                Format "AOI QC Canal USV Notification" — 1 baris per Canal ID.
              </div>
            </div>
          </div>
          <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100" onClick={close} aria-label="Tutup">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {!result ? (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragOver
                  ? 'scale-[1.01] border-brand-400 bg-brand-50/60 shadow-soft'
                  : 'border-slate-300 hover:border-brand-300 hover:bg-slate-50'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                <Icon name={imp.isPending ? 'refresh-cw' : 'upload'} className={`h-6 w-6 ${imp.isPending ? 'animate-spin' : ''}`} />
              </span>
              <div className="text-sm font-semibold text-slate-800">
                {imp.isPending ? 'Memproses…' : 'Tarik file Excel ke sini'}
              </div>
              <div className="text-xs text-slate-500">atau klik untuk pilih file (.xlsx, max 10 MB)</div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => accept(e.target.files?.[0])}
              />
            </div>
          ) : (
            <ResultSummary result={result} />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-3">
          {result && (
            <button className="btn btn-ghost" onClick={() => setResult(null)}>
              <Icon name="upload" className="h-4 w-4" />
              Import lagi
            </button>
          )}
          <button className="btn btn-primary" onClick={close}>
            Selesai
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ResultSummary({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Ter-import" value={result.canalCount} tone="emerald" />
        <Stat label="Duplikat" value={result.duplicates.length} tone="amber" />
        <Stat label="Baris error" value={result.errors.length} tone="rose" />
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/50">
          <div className="border-b border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">
            Baris dilewati ({result.errors.length})
          </div>
          <ul className="max-h-40 divide-y divide-rose-100 overflow-y-auto text-xs">
            {result.errors.map((e) => (
              <li key={e.row} className="px-3 py-2">
                <span className="font-mono font-semibold text-rose-700">Baris {e.row}</span>
                {e.orderNo && <span className="text-slate-500"> · {e.orderNo}</span>}
                <div className="mt-0.5 text-slate-600">{e.reasons.join('; ')}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.duplicates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
          Order No sudah ada (dilewati): {result.duplicates.slice(0, 8).join(', ')}
          {result.duplicates.length > 8 && ` +${result.duplicates.length - 8} lagi`}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'rose' }) {
  const cls = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className={`text-2xl font-bold tabular-nums ${value > 0 ? cls : 'text-slate-300'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
