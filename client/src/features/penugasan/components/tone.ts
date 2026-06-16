/**
 * Peta tone → kelas Tailwind STATIK.
 *
 * PENTING: Tailwind JIT (produksi) mem-purge kelas yang tidak muncul literal di source.
 * Jadi JANGAN pakai `bg-${tone}-50` (demo CDN bisa, JIT TIDAK). Semua kombinasi ditulis
 * eksplisit di sini supaya ke-scan & badge deadline/status tetap berwarna benar.
 *
 * tone = output `shared/domain/deadline` (rose/amber/emerald/slate/brand) — DOMAIN.md poin 1.
 */
import type { Tone } from '../../../shared/types.js';

/** Badge solid lembut (bg-50 + text-700) untuk chip deadline. */
export const TONE_BADGE: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
};

/** Dot kecil di dalam badge. */
export const TONE_DOT: Record<Tone, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  brand: 'bg-brand-500',
};

/** Warna teks saja (untuk label inline + ikon alarm). */
export const TONE_TEXT: Record<Tone, string> = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  slate: 'text-slate-600',
  brand: 'text-brand-600',
};

/** Badge status canal (DOMAIN.md "Status flow" warna). */
export const STATUS_BADGE: Record<string, { cls: string; dot: string }> = {
  Submitted: { cls: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
  Assigned: { cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  'In Progress': { cls: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500 animate-pulse-dot' },
  Done: { cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};
