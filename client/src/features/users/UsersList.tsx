/**
 * UsersList (`/users`) — manajemen operator & akun (admin-only). Port demo
 * `view-users` + `renderUsers`: 4 KPI card + tabel operator (avatar, role badge,
 * USV mono, status dot, produktivitas bar) + search + filter segmented + aksi baris
 * (edit / reset PIN / nonaktifkan) lewat menu. Tambah/edit via UserForm modal.
 *
 * Default export → diwire di router sebagai route `/users` (requireRole admin).
 * Visual premium: data-density tinggi, palet restrained + aksen brand, Lucide 1 weight,
 * angka tabular-nums (anti-goyang).
 */
import { useMemo, useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import { confirmDialog } from '../../shared/layout/confirm.js';
import { toast } from '../../shared/stores/ui.js';
import { useUsers, useDeleteUser, useResetPin, deriveUsersKpi } from './hooks.js';
import { UserForm } from './UserForm.js';
import { UserKpiCards } from './components/UserKpiCards.js';
import { UserRow } from './components/UserRow.js';
import { ResetPinDialog } from './components/ResetPinDialog.js';
import type { ManagedUser } from './api.js';

type RoleFilter = 'all' | 'admin' | 'operator';

export default function UsersList() {
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const del = useDeleteUser();
  const reset = useResetPin();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
  const [pinTarget, setPinTarget] = useState<ManagedUser | null>(null);

  const kpi = useMemo(() => deriveUsersKpi(users), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.usv ?? '').toLowerCase().includes(q) ||
        u.role.includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const openAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (u: ManagedUser) => {
    setEditTarget(u);
    setFormOpen(true);
  };

  const onDelete = (u: ManagedUser) => {
    confirmDialog({
      title: 'Nonaktifkan operator?',
      body: `Akun ${u.name} (${u.email}) akan dinonaktifkan. Jejak penugasan & audit tetap tersimpan. Bisa diaktifkan lagi lewat reset PIN.`,
      confirm: 'Nonaktifkan',
      danger: true,
      onConfirm: () =>
        del.mutate(u.id, {
          onSuccess: () => toast(`${u.name} dinonaktifkan`, 'ok'),
          onError: () => toast('Gagal menonaktifkan akun', 'err'),
        }),
    });
  };

  const onResetPin = (u: ManagedUser, pin: string) => {
    reset.mutate(
      { id: u.id, pin },
      {
        onSuccess: () => {
          toast(`PIN ${u.name} di-reset`, 'ok');
          setPinTarget(null);
        },
        onError: () => toast('Gagal reset PIN', 'err'),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operator &amp; akun</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola pengguna, role, dan penugasan USV.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => toast('Export operator (segera)', 'info')}>
            <Icon name="download" className="h-4 w-4" />
            Export
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="user-plus" className="h-4 w-4" />
            Tambah operator
          </button>
        </div>
      </header>

      {/* KPI */}
      <UserKpiCards kpi={kpi} loading={isLoading} />

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3 dark:border-slate-700">
          <div className="relative min-w-[200px] flex-1">
            <Icon
              name="search"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"
            />
            <input
              className="input input-sm pl-9"
              placeholder="Cari nama, email, USV, role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/40">
            {(['all', 'admin', 'operator'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-soft dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {r === 'all' ? 'Semua' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 text-left">User</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-left">USV</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Produktivitas (30d)</th>
                <th className="px-4 py-2.5 text-left">Terakhir aktif</th>
                <th className="w-12 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading && <SkeletonRows />}
              {!isLoading &&
                filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onEdit={() => openEdit(u)}
                    onResetPin={() => setPinTarget(u)}
                    onDelete={() => onDelete(u)}
                  />
                ))}
            </tbody>
          </table>

          {!isLoading && isError && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Icon name="alert-triangle" className="h-7 w-7" />
              </div>
              <div className="font-semibold">Gagal memuat akun</div>
              <button className="btn btn-ghost mt-3" onClick={() => refetch()}>
                <Icon name="refresh-cw" className="h-4 w-4" />
                Coba lagi
              </button>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Icon name="search-x" className="h-7 w-7" />
              </div>
              <div className="font-semibold">Tidak ada akun yang cocok</div>
              <div className="mt-1 text-sm text-slate-500">Coba ubah kata kunci atau filter role.</div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserForm open={formOpen} user={editTarget} onClose={() => setFormOpen(false)} />
      <ResetPinDialog
        user={pinTarget}
        pending={reset.isPending}
        onClose={() => setPinTarget(null)}
        onSubmit={onResetPin}
      />
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-100 shimmer dark:bg-slate-700" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-slate-100 shimmer dark:bg-slate-700" />
                <div className="h-2.5 w-36 rounded bg-slate-100 shimmer dark:bg-slate-700" />
              </div>
            </div>
          </td>
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 w-16 rounded bg-slate-100 shimmer dark:bg-slate-700" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
