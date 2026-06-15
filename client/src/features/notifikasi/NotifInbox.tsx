/**
 * NotifInbox (`/notifikasi`) — port `view-notifikasi` + `renderNotifikasi` demo.
 *
 * List notif (terbaru dulu), baris unread di-highlight + dot brand, hover ungkap tombol
 * "tandai dibaca" per item, tombol "Tandai semua dibaca" di header. Update badge sidebar
 * + tab title via <NotifBadge/> (port `updateTitleBadge`).
 *
 * Visual restrained ala Linear/Stripe: kartu putih border tipis, divide antar baris,
 * satu aksen brand untuk unread, ikon ber-tone per jenis (anti-purge: kelas statik dari
 * components/tone.ts). Lucide di-import langsung (slice-local; barrel shell minimal).
 */
import { CheckCheck, BellOff, Check, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { useInbox, useMarkRead, useMarkAllRead } from './hooks.js';
import { NOTIF_ICON_WRAP, resolveNotifIcon } from './components/tone.js';
import { relativeTime } from './relativeTime.js';
import { NotifBadge } from './NotifBadge.js';
import type { Notification } from '../../shared/types.js';

function NotifRow({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const IconCmp = resolveNotifIcon(notif.icon);
  const unread = !notif.read;
  return (
    <div
      className={`group flex gap-3 p-4 transition-colors ${
        unread ? 'bg-brand-50/40' : 'hover:bg-slate-50'
      }`}
    >
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          NOTIF_ICON_WRAP[notif.color]
        }`}
      >
        <IconCmp className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div
            className={`text-sm font-semibold leading-snug ${
              unread ? 'text-slate-900' : 'text-slate-600'
            }`}
          >
            {notif.title}
          </div>
          {unread && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          )}
        </div>
        {notif.body && (
          <div className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {notif.body}
          </div>
        )}
        <div className="mt-1 font-mono text-[11px] text-slate-400">
          {relativeTime(notif.ts)}
        </div>
      </div>

      {unread && (
        <button
          type="button"
          onClick={() => onRead(notif._id)}
          aria-label="Tandai dibaca"
          title="Tandai dibaca"
          className="self-start rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse gap-3 p-4">
      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <div className="h-3.5 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
        <div className="h-2.5 w-20 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function NotifInbox() {
  const { data, isLoading, isError, refetch, isFetching } = useInbox();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      {/* Sinkron badge sidebar + tab title (headless). */}
      <NotifBadge />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
            Notifikasi
            {unread > 0 && (
              <span className="text-base font-medium text-brand-600">
                {unread}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aktivitas terbaru di workspace.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
            className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
            Tandai semua dibaca
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            title="Atur notifikasi (segera hadir)"
          >
            <BellOff className="h-4 w-4" strokeWidth={1.75} />
            Atur notif
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-500">
              <RefreshCw className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Gagal memuat notifikasi
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Periksa koneksi lalu coba lagi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="btn btn-ghost"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              )}
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
              <Inbox className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Belum ada notifikasi
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Undangan, penugasan, dan status sync akan muncul di sini.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((n) => (
              <NotifRow
                key={n._id}
                notif={n}
                onRead={(id) => markRead.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotifInbox;
