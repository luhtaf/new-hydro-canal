/**
 * AuditLog (/audit) — timeline jejak aksi admin. Read-only, admin-only.
 *
 * Port demo `view-audit` + `renderAudit`: avatar gradient, baris waktu mono,
 * "user · kind → target", badge aksi berwarna, empty state. DITAMBAH:
 * - infinite scroll (TanStack `useInfiniteQuery`) lewat IntersectionObserver sentinel
 * - filter user (free-text) / aksi / rentang tanggal (server-side)
 * - export CSV dari halaman yang sudah ter-load
 * - grouping per hari (heading sticky) untuk data-density tinggi ala Linear/Vercel
 *
 * Server-state via API (bukan PouchDB) — sama pola dgn slice [data] admin.
 */
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Pencil,
  CloudUpload,
  UserPlus,
  SlidersHorizontal,
  LogIn,
  FileDown,
  FileUp,
  Activity,
  Loader2,
  SearchX,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { useAuditInfinite } from './hooks.js';
import type { AuditFilter } from './api.js';
import { toast } from '../../shared/stores/ui.js';
import type { AuditAction, AuditLog as AuditEntry } from '../../shared/types.js';

// ─── Mapping aksi → ikon + tone (port demo actionIcon/actionColor, diperluas) ───
const ACTION_META: Record<
  AuditAction,
  { icon: LucideIcon; label: string; tone: Tone }
> = {
  edit: { icon: Pencil, label: 'Edit', tone: 'brand' },
  sync: { icon: CloudUpload, label: 'Sync', tone: 'emerald' },
  assign: { icon: UserPlus, label: 'Assign', tone: 'amber' },
  threshold: { icon: SlidersHorizontal, label: 'Threshold', tone: 'rose' },
  login: { icon: LogIn, label: 'Login', tone: 'slate' },
  export: { icon: FileDown, label: 'Export', tone: 'violet' },
  import: { icon: FileUp, label: 'Import', tone: 'cyan' },
};

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet' | 'cyan';

// Kelas lengkap (Tailwind butuh literal statis, bukan interpolasi) — ditune restrained.
const TONE_BADGE: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
};

const AVATAR_TONE: Record<Tone, string> = {
  brand: 'from-brand-500 to-brand-700',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  rose: 'from-rose-500 to-rose-700',
  slate: 'from-slate-500 to-slate-700',
  violet: 'from-violet-500 to-violet-700',
  cyan: 'from-cyan-500 to-cyan-700',
};

const ACTION_OPTIONS: AuditAction[] = [
  'assign',
  'edit',
  'sync',
  'threshold',
  'login',
  'export',
  'import',
];

// ─── Helper waktu ───────────────────────────────────────────────────────────
function initials(entry: AuditEntry): string {
  if (entry.userInitials) return entry.userInitials.slice(0, 2).toUpperCase();
  const parts = entry.userName.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').concat(parts[1]?.[0] ?? '').toUpperCase();
}

/** Tone deterministik per user (avatar) — stabil lintas render. */
function userTone(name: string): Tone {
  const tones: Tone[] = ['brand', 'emerald', 'amber', 'rose', 'violet', 'cyan'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return tones[Math.abs(h) % tones.length] as Tone;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function fmtDayHeading(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return 'Hari ini';
  if (dayKey(iso) === dayKey(yest.toISOString())) return 'Kemarin';
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── CSV export (dari data yang sudah ter-load) ──────────────────────────────
function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function exportCsv(rows: AuditEntry[]): void {
  const header = ['Waktu', 'User', 'Aksi', 'Kind', 'Target', 'Detail'];
  const lines = rows.map((r) =>
    [r.ts, r.userName, r.action, r.kind, r.target, r.detail ?? '']
      .map((c) => csvCell(String(c)))
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Komponen ────────────────────────────────────────────────────────────────
export default function AuditLog() {
  const [q, setQ] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Debounce pencarian teks supaya tidak query tiap ketukan.
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filter: AuditFilter = useMemo(
    () => ({
      q: debouncedQ || undefined,
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [debouncedQ, action, from, to],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAuditInfinite(filter);

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  // Group per hari untuk heading sticky.
  const groups = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const it of items) {
      const k = dayKey(it.ts);
      const arr = map.get(k);
      if (arr) arr.push(it);
      else map.set(k, [it]);
    }
    return Array.from(map.entries());
  }, [items]);

  // IntersectionObserver sentinel → fetchNextPage.
  const sentinel = useRef<HTMLDivElement | null>(null);
  const onIntersect = useCallback<IntersectionObserverCallback>(
    (entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(onIntersect, { rootMargin: '320px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onIntersect]);

  const hasFilters = !!(debouncedQ || action || from || to);
  const clearFilters = () => {
    setQ('');
    setAction('');
    setFrom('');
    setTo('');
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
            <ScrollText className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Audit log
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Riwayat semua aksi penting — siapa, apa, kapan, target.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (items.length === 0) {
              toast('Tidak ada baris untuk diekspor', 'info');
              return;
            }
            exportCsv(items);
            toast(`${items.length} baris diekspor ke CSV`, 'ok');
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
          Export CSV
        </button>
      </header>

      {/* Filter bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input input-sm pl-9"
              placeholder="Cari user, aksi, target…"
              aria-label="Cari audit"
            />
          </div>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as AuditAction | '')}
            className="input input-sm w-auto"
            aria-label="Filter aksi"
          >
            <option value="">Semua aksi</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {ACTION_META[a].label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input input-sm w-auto"
            aria-label="Dari tanggal"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input input-sm w-auto"
            aria-label="Sampai tanggal"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              Reset
            </button>
          )}
          <span className="ml-auto text-xs tabular-nums text-slate-400">
            {isLoading ? '…' : `${items.length} / ${total}`} log
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <AuditSkeleton />
        ) : isError ? (
          <ErrorState
            message={(error as Error)?.message ?? 'Gagal memuat audit log'}
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState filtered={hasFilters} />
        ) : (
          <div>
            {groups.map(([key, rows]) => (
              <section key={key}>
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white/85 px-4 py-2 backdrop-blur">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {fmtDayHeading(rows[0]!.ts)}
                  </span>
                  <span className="h-px flex-1 bg-slate-100" />
                  <span className="text-[11px] tabular-nums text-slate-400">
                    {rows.length}
                  </span>
                </div>
                <ol className="divide-y divide-slate-50">
                  {rows.map((entry) => (
                    <AuditRow key={entry._id} entry={entry} />
                  ))}
                </ol>
              </section>
            ))}

            {/* Sentinel + status infinite scroll */}
            <div ref={sentinel} className="h-px" />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memuat lebih banyak…
              </div>
            )}
            {!hasNextPage && items.length > 0 && (
              <div className="py-4 text-center text-xs text-slate-300">
                Akhir riwayat
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Baris audit (port demo .audit-row, ditata grid presisi) ─────────────────
function AuditRow({ entry }: { entry: AuditEntry }) {
  const meta = ACTION_META[entry.action] ?? {
    icon: Activity,
    label: entry.action,
    tone: 'slate' as Tone,
  };
  const ActionIcon = meta.icon;
  const aTone = userTone(entry.userName);

  return (
    <li className="grid grid-cols-[2rem_3.5rem_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50/70">
      <span
        className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${AVATAR_TONE[aTone]} text-[10px] font-bold text-white shadow-sm`}
        title={entry.userName}
      >
        {initials(entry)}
      </span>
      <time className="font-mono text-xs tabular-nums text-slate-400">
        {fmtTime(entry.ts)}
      </time>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{entry.userName}</span>
          <span className="px-1.5 text-slate-300">·</span>
          {entry.kind}
          {entry.target && (
            <>
              <span className="px-1.5 text-slate-300">→</span>
              <span className="font-mono text-xs text-slate-500">
                {entry.target}
              </span>
            </>
          )}
        </p>
        {entry.detail && (
          <p className="mt-0.5 truncate text-xs text-slate-400">{entry.detail}</p>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE_BADGE[meta.tone]}`}
      >
        <ActionIcon className="h-3 w-3" strokeWidth={2} />
        {meta.label}
      </span>
    </li>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────
function AuditSkeleton() {
  return (
    <div className="divide-y divide-slate-50">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-slate-100" />
          <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-16 shrink-0 animate-pulse rounded-md bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <SearchX className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <div className="font-semibold text-slate-700">
        {filtered ? 'Tidak ada log yang cocok' : 'Belum ada aktivitas'}
      </div>
      <div className="mt-1 text-sm text-slate-500">
        {filtered
          ? 'Coba ubah filter atau kata kunci.'
          : 'Jejak aksi akan muncul di sini saat ada perubahan data.'}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon !bg-rose-50 !text-rose-400">
        <AlertCircle className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <div className="font-semibold text-slate-700">Gagal memuat audit log</div>
      <div className="mt-1 text-sm text-slate-500">{message}</div>
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-ghost mt-3 inline-flex"
      >
        Coba lagi
      </button>
    </div>
  );
}
