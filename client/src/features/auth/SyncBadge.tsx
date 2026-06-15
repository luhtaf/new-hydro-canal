/**
 * SyncBadge — indikator sync per-akun (spec § C "✅ full sync / ⏳ N belum terkirim").
 *
 * Baca `account.sync.pending`. Sumber data = sync engine yang panggil
 * `setSyncState(userId, { pending, lastSyncedAt })`. Komponen ini murni tampilan.
 *
 * Dipakai di dua tempat: ringkas (`compact`) di pill AccountSwitcher, dan penuh
 * di topnav / settings.
 */
import { CheckCircle2, CloudUpload } from 'lucide-react';
import type { AccountSyncState } from './store.js';

export function SyncBadge({
  sync,
  compact = false,
}: {
  sync: AccountSyncState;
  compact?: boolean;
}) {
  const full = sync.pending === 0;

  if (compact) {
    return full ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-label="Full sync" />
    ) : (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
        <CloudUpload className="w-3 h-3" />
        {sync.pending}
      </span>
    );
  }

  return full ? (
    <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" /> Full sync
    </span>
  ) : (
    <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
      <CloudUpload className="w-3.5 h-3.5" /> {sync.pending} belum terkirim
    </span>
  );
}
