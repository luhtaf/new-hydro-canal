/**
 * Peta tone notifikasi → kelas Tailwind STATIK + resolver ikon.
 *
 * Kenapa statik: Tailwind JIT mem-purge kelas yang tidak muncul utuh di source. Demo
 * pakai `bg-${color}-50` (template literal) yang akan ke-purge → harus dieja penuh di
 * sini (pola sama `penugasan/components/tone.ts`).
 *
 * Ikon notif datang sebagai nama kebab dari server (`mail`/`git-merge`/dst). Slice ini
 * me-resolve ke komponen lucide-react langsung (slice-local; barrel shell minimal).
 */
import {
  Mail,
  GitMerge,
  CircleCheckBig,
  ClipboardList,
  Settings2,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationColor } from '../../../shared/types.js';

/** Wadah ikon notif (bg lembut + warna ikon) per token brand. */
export const NOTIF_ICON_WRAP: Record<NotificationColor, string> = {
  brand: 'bg-brand-50 text-brand-600',
  rose: 'bg-rose-50 text-rose-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

/** Resolver nama ikon kebab → komponen lucide. Fallback `Bell` untuk nama tak dikenal. */
const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  'git-merge': GitMerge,
  'cloud-check': CircleCheckBig,
  'clipboard-list': ClipboardList,
  'settings-2': Settings2,
  bell: Bell,
};

export function resolveNotifIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Bell;
}
