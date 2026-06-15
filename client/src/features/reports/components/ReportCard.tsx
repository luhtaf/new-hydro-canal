/**
 * ReportCard — kontainer panel putih konsisten (border halus + shadow-soft) dgn
 * judul section kecil + sub kanan. Port struktur panel demo view-reports.
 */
import type { ReactNode } from 'react';

interface Props {
  title: string;
  /** teks kecil di kanan judul (mis. "30 hari terakhir"). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ReportCard({ title, aside, children, className = '' }: Props) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-soft ${className}`}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="text-[13px] font-semibold tracking-tight text-slate-700">{title}</div>
        {aside && <div className="text-xs text-slate-500">{aside}</div>}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}
