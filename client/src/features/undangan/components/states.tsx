/**
 * State primitif slice undangan: skeleton, empty, error. Demo touch: shimmer skeleton,
 * EmptyState icon-grid + CTA, error retry. Slice-local (mirror pola slice data).
 */
import type { ReactNode } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import type { IconName } from '../../../shared/lib/icon.js';

export function TableSkeleton({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="shimmer h-4 rounded bg-slate-100"
                style={{ width: `${100 / cols}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = 'info',
  heading,
  sub,
  cta,
}: {
  icon?: IconName;
  heading: string;
  sub?: string;
  cta?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      {sub && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{sub}</p>}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        <Icon name="alert-triangle" className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">Gagal memuat data</h3>
      <p className="mt-1 text-sm text-slate-500">{message ?? 'Periksa koneksi lalu coba lagi.'}</p>
      {onRetry && (
        <button className="btn btn-ghost mt-4" onClick={onRetry}>
          <Icon name="refresh-cw" className="h-4 w-4" />
          Coba lagi
        </button>
      )}
    </div>
  );
}
