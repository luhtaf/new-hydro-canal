/**
 * LokalSection — section Penyimpanan lokal (port demo view-pengaturan blok storage).
 *
 * Statistik PouchDB akun aktif (size estimasi · jumlah doc · sync terakhir) +
 * aksi: Sinkron paksa (syncNow), Ekspor backup (dump JSON allDocs), Reset lokal
 * (destroyPouch via confirmDialog). Angka REAL dari Storage API + allDocs + meta
 * sync — bukan placeholder demo.
 */
import { Icon } from '../../../shared/layout/Icon.js';
import { confirmDialog } from '../../../shared/layout/confirm.js';
import { toast } from '../../../shared/stores/ui.js';
import { useAuthStore } from '../../auth/store.js';
import { getPouch } from '../../../shared/db/pouch.js';
import { useUi } from '../../../shared/stores/ui.js';
import { useLocalStats, useLocalActions } from '../hooks.js';
import { SectionCard } from './SectionCard.js';

function fmtBytes(n: number | null): string {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function relTime(iso: string | null): string {
  if (!iso) return 'Belum pernah';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Baru saja';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function StatTile({
  label,
  children,
  foot,
}: {
  label: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      {children}
      {foot}
    </div>
  );
}

export function LokalSection() {
  const userId = useAuthStore((s) => s.activeUserId);
  const online = useUi((s) => s.online);
  const { data: stats, isLoading } = useLocalStats();
  const { forceSync, resetLocal, isSyncing } = useLocalActions();

  const usage = stats?.usageBytes ?? null;
  const quota = stats?.quotaBytes ?? null;
  const pct = usage != null && quota ? Math.min(100, Math.round((usage / quota) * 100)) : null;

  async function exportBackup() {
    if (!userId) return;
    try {
      const db = getPouch(userId);
      const all = await db.allDocs({ include_docs: true });
      const docs = all.rows
        .map((r) => r.doc)
        .filter((d): d is NonNullable<typeof d> => Boolean(d) && !d!._id.startsWith('_design/'));
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), userId, docs }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hydrocanal-backup-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Backup ${docs.length} dokumen diunduh`, 'ok');
    } catch {
      toast('Gagal membuat backup', 'warn');
    }
  }

  function handleReset() {
    confirmDialog({
      title: 'Hapus semua data lokal?',
      body: 'Semua draft, threshold lokal, antrian sync, dan edit offline akan hilang. Data akan di-seed ulang dari server saat online berikutnya. Tidak bisa di-undo.',
      confirm: 'Ya, hapus',
      danger: true,
      onConfirm: () => void resetLocal(),
    });
  }

  return (
    <SectionCard title="Penyimpanan lokal" wide>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <StatTile
          label="Terpakai"
          foot={
            pct != null ? (
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-1">Estimasi tidak tersedia</div>
            )
          }
        >
          <div className="text-2xl font-bold mt-1 tabular-nums">{isLoading ? '…' : fmtBytes(usage)}</div>
          <div className="text-xs text-slate-500">
            {quota != null ? `dari ${fmtBytes(quota)} kuota` : 'kuota perangkat'}
          </div>
        </StatTile>

        <StatTile label="Dokumen">
          <div className="text-2xl font-bold mt-1 tabular-nums">{isLoading ? '…' : (stats?.docCount ?? 0)}</div>
          <div className="text-xs text-slate-500">
            {stats?.pendingCount ? `${stats.pendingCount} di antrian sync` : 'Semua tersinkron'}
          </div>
        </StatTile>

        <StatTile label="Sync terakhir">
          <div className="text-lg font-bold mt-1">{isLoading ? '…' : relTime(stats?.lastSyncedAt ?? null)}</div>
          <div
            className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
              stats?.pendingCount ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            <Icon name={stats?.pendingCount ? 'clock' : 'check-circle-2'} className="w-3 h-3" />
            {stats?.pendingCount ? 'Ada antrian' : 'Berhasil'}
          </div>
        </StatTile>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
        <button className="btn btn-ghost" disabled={isSyncing || !online} onClick={() => void forceSync()}>
          <Icon name="refresh-cw" className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Menyinkronkan…' : 'Sinkron paksa'}
        </button>
        <button className="btn btn-ghost" onClick={() => void exportBackup()}>
          <Icon name="download" className="h-4 w-4" />
          Ekspor backup
        </button>
        <button className="btn btn-danger ml-auto" onClick={handleReset}>
          <Icon name="trash-2" className="h-4 w-4" />
          Reset lokal
        </button>
      </div>

      {!online && (
        <div className="mt-3 text-[11px] text-amber-600 flex items-center gap-1.5">
          <Icon name="wifi-off" className="w-3.5 h-3.5" />
          Perangkat offline — sinkron paksa nonaktif sampai kembali online.
        </div>
      )}
    </SectionCard>
  );
}
