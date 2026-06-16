/**
 * SectionCard — kartu section pengaturan (header + body) ala demo view-pengaturan.
 * Border halus + shadow-soft + judul `.sec-title`, opsional badge kanan & lebar penuh.
 */
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  /** elemen kanan header (mis. lock badge). */
  action?: ReactNode;
  /** span 2 kolom di grid lg. */
  wide?: boolean;
  children: ReactNode;
  /** padding-less body (untuk grid statistik custom). */
  flush?: boolean;
}

export function SectionCard({ title, action, wide, children, flush }: SectionCardProps) {
  return (
    <section
      className={`bg-white rounded-xl border border-slate-200 shadow-soft ${
        wide ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="sec-title">{title}</div>
        {action}
      </div>
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  );
}
