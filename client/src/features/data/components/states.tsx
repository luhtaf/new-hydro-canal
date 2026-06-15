/**
 * State primitif untuk page data: Loading skeleton, Empty, Error.
 * Port "touches" demo: skeleton shimmer, EmptyState icon-grid + CTA, error retry.
 * Slice-local.
 */
import type { ReactNode } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import type { IconName } from '../../../shared/lib/icon.js';

/** Skeleton baris tabel (shimmer dari globals.css). */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 rounded bg-slate-100 shimmer"
                style={{ width: `${100 / cols}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EmptyProps {
  icon?: IconName;
  heading: string;
  sub?: string;
  cta?: ReactNode;
}

export function EmptyState({ icon = 'info', heading, sub, cta }: EmptyProps) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      {sub && <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{sub}</p>}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

interface ErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorProps) {
  return (
    <div className="bg-white rounded-xl border border-rose-200 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        <Icon name="alert-triangle" className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">Gagal memuat data</h3>
      <p className="mt-1 text-sm text-slate-500">
        {message ?? 'Periksa koneksi lalu coba lagi.'}
      </p>
      {onRetry && (
        <button className="btn btn-ghost mt-4" onClick={onRetry}>
          <Icon name="refresh-cw" className="h-4 w-4" />
          Coba lagi
        </button>
      )}
    </div>
  );
}
