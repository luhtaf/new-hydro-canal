/**
 * PageShell — wrapper konsisten untuk semua page slice `data`.
 * Header (judul + subjudul + slot aksi) + area konten. Visual: kartu putih ala demo.
 * Slice-local (cuma dipakai page data) → bukan kandidat shared (guardrail #1).
 */
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: ReactNode;
  /** tombol aksi di kanan header (Tambah, Export, dll). */
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
