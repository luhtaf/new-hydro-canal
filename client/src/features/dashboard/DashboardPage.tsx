/**
 * DashboardPage — home (`/`). Port demo `view-dashboard` + `renderDashboard`.
 *
 * Komposisi:
 *   - Header: sapaan hidup (useLiveClock) + tanggal panjang + LiveClock jam tick 1s
 *     + aksi (Export / Undangan baru, admin-only).
 *   - 4 KPI StatCard: Undangan aktif · Penugasan saya · QC pass rate · Antrian sync.
 *     3 dari /alldatas (useDashboardDerived), Antrian sync = outbox PouchDB lokal
 *     (useSyncQueue slice [konflik] — count nyata, bukan network).
 *   - Penugasan minggu ini (list) + Status QC terbaru (3).
 *   - LiveActivity feed (polling 30s /audit/recent).
 *
 * Default export → diwire di router sebagai index route `/` (lihat field wiring).
 * Visual premium: data-density tinggi, palet restrained + aksen brand, Lucide 1 weight.
 */
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { useAuth, useRole } from '../auth/hooks.js';
import { useSyncQueue } from '../konflik/useSyncQueue.js';
import { useRecentActivity, useDashboardDerived } from './hooks.js';
import { useLiveClock, LiveClock } from './components/LiveClock.js';
import { StatCard } from './components/StatCard.js';
import { LiveActivity } from './components/LiveActivity.js';
import { WeekTasks, RecentQc } from './components/WeekTasks.js';

export default function DashboardPage() {
  const clock = useLiveClock();
  const { account } = useAuth();
  const { isAdmin } = useRole();

  const { kpi, weekTasks, recentQc, isLoading, isError } = useDashboardDerived();
  const activity = useRecentActivity();
  const outbox = useSyncQueue();
  const pendingSync = outbox.length;

  const firstName = (account?.name ?? 'Tim').split(' ')[0];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 text-[13px] text-slate-500">
            <span className="capitalize">{clock.fullDate}</span>
            <span className="text-slate-300">·</span>
            <LiveClock time={clock.time} />
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {clock.greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {kpi.penugasanSaya} penugasan aktif minggu ini
            {pendingSync > 0 ? ` · ${pendingSync} menunggu sinkron.` : '.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost">
            <Icon name="printer" className="h-4 w-4" />
            Export
          </button>
          {isAdmin && (
            <Link to="/undangan/baru" className="btn btn-primary">
              <Icon name="plus-circle" className="h-4 w-4" />
              Undangan baru
            </Link>
          )}
        </div>
      </header>

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Undangan aktif"
          value={kpi.undanganAktif}
          tone="brand"
          badge={{ text: String(kpi.undanganAktif), tone: 'brand' }}
          hint={
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <Icon name="arrow-right" className="h-3 w-3 -rotate-45" />
              AOI berjalan
            </span>
          }
          loading={isLoading}
        />
        <StatCard
          label="Penugasan saya"
          value={kpi.penugasanSaya}
          icon="clipboard-list"
          hint="Tugas lapangan ter-assign"
          loading={isLoading}
        />
        <StatCard
          label="QC pass rate"
          value={kpi.qcPassRate}
          unit="%"
          tone="emerald"
          icon="cloud-check"
          hint={`${kpi.qcPassCount} dari ${kpi.qcTotalCount} kanal`}
          loading={isLoading}
        />
        <StatCard
          label="Antrian sync"
          value={pendingSync}
          tone={pendingSync > 0 ? 'amber' : 'emerald'}
          badge={
            pendingSync > 0
              ? { text: 'tertunda', tone: 'amber', pulse: true }
              : { text: 'sinkron', tone: 'emerald' }
          }
          hint={pendingSync > 0 ? 'Kembali online untuk kirim' : 'Semua perubahan terkirim'}
        />
      </div>

      {isError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Icon name="alert-triangle" className="mr-1.5 inline h-4 w-4 -mt-0.5" />
          Sebagian data ringkasan gagal dimuat. KPI bisa belum lengkap.
        </div>
      )}

      {/* Penugasan + Status QC */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeekTasks tasks={weekTasks} loading={isLoading} />
        </div>
        <RecentQc rows={recentQc} loading={isLoading} />
      </div>

      {/* Live activity */}
      <LiveActivity items={activity.data ?? []} loading={activity.isLoading} />
    </div>
  );
}
