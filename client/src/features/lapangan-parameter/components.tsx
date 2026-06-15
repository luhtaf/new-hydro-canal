/**
 * components.tsx — primitif UI form Parameter (port "touches" demo
 * view-lapangan-parameter: border red/orange/green realtime, badge inline,
 * checklist validasi, preview filename).
 *
 * Visual sengaja restrained (kiblat Linear/Vercel): 1 aksen brand sky, density
 * tinggi, Lucide 1 weight. Border state pakai variabel CSS dari globals.
 */
import type { ReactNode } from 'react';
import { Icon } from '../../shared/layout/Icon.js';

/** Tone validasi inline. ok=hijau, warn=jingga, err=merah, idle=netral. */
export type FieldTone = 'idle' | 'ok' | 'warn' | 'err';

const TONE_RING: Record<FieldTone, string> = {
  idle: '',
  ok: 'border-emerald-400 ring-2 ring-emerald-500/15',
  warn: 'border-amber-400 ring-2 ring-amber-500/15',
  err: 'border-rose-400 ring-2 ring-rose-500/15',
};

const TONE_TEXT: Record<FieldTone, string> = {
  idle: 'text-slate-500',
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  err: 'text-rose-600',
};

const TONE_ICON: Record<FieldTone, string> = {
  idle: 'info',
  ok: 'check',
  warn: 'alert-triangle',
  err: 'alert-triangle',
};

interface ValidatedFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tone: FieldTone;
  /** Pesan di bawah field (error/warn/ok). */
  hint?: ReactNode;
  type?: 'text' | 'number' | 'date';
  mono?: boolean;
  placeholder?: string;
  /** Field readonly auto-fill (dari assignment) → visual tenang. */
  readOnly?: boolean;
  /** Badge kecil di pojok kanan input (mis. "match page 3"). */
  badge?: string;
  badgeTone?: FieldTone;
}

export function ValidatedField({
  label,
  value,
  onChange,
  tone,
  hint,
  type = 'text',
  mono,
  placeholder,
  readOnly,
  badge,
  badgeTone = 'ok',
}: ValidatedFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative mt-1.5">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={[
            'input',
            mono ? 'font-mono' : '',
            badge ? 'pr-24' : '',
            readOnly ? 'bg-slate-50 text-slate-600' : '',
            tone === 'idle' ? '' : TONE_RING[tone],
          ].join(' ')}
        />
        {badge && (
          <span
            className={[
              'absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-semibold',
              badgeTone === 'ok'
                ? 'bg-emerald-50 text-emerald-600'
                : badgeTone === 'err'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600',
            ].join(' ')}
          >
            {badge}
          </span>
        )}
      </div>
      {hint && (
        <div
          className={`mt-1 flex items-center gap-1 text-[11px] ${TONE_TEXT[tone]}`}
        >
          {tone !== 'idle' && (
            <Icon name={TONE_ICON[tone] as 'check'} className="h-3 w-3 shrink-0" />
          )}
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

/** Kartu section putih dgn header + opsi badge status di kanan. */
export function SectionCard({
  title,
  icon,
  status,
  children,
}: {
  title: string;
  icon: string;
  status?: { tone: FieldTone; label: string };
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Icon name={icon as 'ruler'} className="h-4 w-4 text-brand-600" />
          <div className="sec-title text-base">{title}</div>
        </div>
        {status && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${TONE_TEXT[status.tone]}`}
          >
            <Icon
              name={(status.tone === 'ok' ? 'check-circle-2' : 'alert-triangle') as 'check'}
              className="h-3.5 w-3.5"
            />
            {status.label}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export interface ChecklistItem {
  label: string;
  tone: FieldTone;
}

/** Sidebar: ringkasan validasi (checklist) dgn ikon per-baris. */
export function ValidationChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((it) => (
        <li key={it.label} className="flex items-start gap-2">
          <Icon
            name={(it.tone === 'ok' ? 'check-circle-2' : 'alert-triangle') as 'check'}
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              it.tone === 'ok'
                ? 'text-emerald-500'
                : it.tone === 'warn'
                  ? 'text-amber-500'
                  : 'text-rose-500'
            }`}
          />
          <span className="text-slate-700">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
