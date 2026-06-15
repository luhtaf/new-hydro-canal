/**
 * UndanganList (`/undangan`) — port demo `view-undangan` + `renderUndangan`.
 *
 * Header 3-card AOI (Region/Area/Vendor dari AOI terbaru) + tabel canal:
 * Order No / Canal ID / District / Contractor / Request Date / DeadlineBadge / Status.
 * Search live + filter status (pills) + bulk shift-select. Import Excel (admin).
 */
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { shortName } from '../../shared/domain/shortName.js';
import { useRole } from '../auth/hooks.js';
import type { CanalStatus } from '../../shared/types.js';
import { useAois, useCanals } from './hooks.js';
import { DeadlineBadge, StatusBadge } from './components/badges.js';
import { AoiHeaderCards } from './components/AoiHeaderCards.js';
import { ImportExcelDialog } from './components/ImportExcelDialog.js';
import { TableSkeleton, EmptyState, ErrorState } from './components/states.js';
import { useShiftSelect } from './useShiftSelect.js';

const STATUS_TABS: Array<{ value: 'semua' | CanalStatus; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
];

const ID_FMT = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : ID_FMT.format(d);
}

export function UndanganList() {
  const { isAdmin } = useRole();
  const [status, setStatus] = useState<'semua' | CanalStatus>('semua');
  const [rawQ, setRawQ] = useState('');
  const [q, setQ] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  // Debounce search 200ms (demo: search live).
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ.trim()), 200);
    return () => clearTimeout(t);
  }, [rawQ]);

  const filter = useMemo(
    () => ({ status: status === 'semua' ? undefined : status, q: q || undefined, limit: 200 }),
    [status, q],
  );

  const aoisQuery = useAois(1, 1);
  const canalsQuery = useCanals(filter);

  const canals = canalsQuery.data?.data ?? [];
  const ids = useMemo(() => canals.map((c) => c.orderNo), [canals]);
  const sel = useShiftSelect(ids);
  const latestAoi = aoisQuery.data?.data?.[0];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Undangan QC Kanal (AOI)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            AOI QC Canal USV Notification — 1 baris per Canal ID, tiap canal punya Order
            No sendiri.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setImportOpen(true)}>
              <Icon name="upload" className="h-4 w-4" />
              Import Excel AOI
            </button>
            <Link to="/undangan/baru" className="btn btn-primary">
              <Icon name="plus" className="h-4 w-4" />
              Undangan baru
            </Link>
          </div>
        )}
      </header>

      <AoiHeaderCards
        region={latestAoi?.region ?? 'Palembang'}
        area={latestAoi?.area ?? 'SUMSEL P1'}
        vendor={latestAoi?.vendor ?? 'PT. KARTA BHUMI NUSANTARA'}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {/* Toolbar: search + status pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Icon name="search" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input input-sm pl-9"
              placeholder="Cari order no, canal ID, kontraktor, distrik…"
              value={rawQ}
              onChange={(e) => setRawQ(e.target.value)}
            />
          </div>
          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {STATUS_TABS.map((t) => {
              const on = status === t.value;
              return (
                <button
                  key={t.value}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    on ? 'bg-white text-slate-900 shadow-soft' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setStatus(t.value)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk action bar */}
        {sel.count > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/60 px-3 py-2 text-sm">
            <div className="font-medium text-brand-800">{sel.count} canal terpilih</div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button className="btn btn-ghost input-sm">
                  <Icon name="user-plus" className="h-3.5 w-3.5" />
                  Assign petugas
                </button>
              )}
              <button className="btn btn-ghost input-sm" onClick={sel.clear}>
                Batal pilih
              </button>
            </div>
          </div>
        )}

        {canalsQuery.isLoading ? (
          <TableSkeleton cols={8} />
        ) : canalsQuery.isError ? (
          <ErrorState onRetry={() => canalsQuery.refetch()} />
        ) : canals.length === 0 ? (
          <EmptyState
            icon="search-x"
            heading={q || status !== 'semua' ? 'Tidak ada undangan yang cocok' : 'Belum ada undangan AOI'}
            sub={
              q || status !== 'semua'
                ? 'Ubah kata kunci atau filter status.'
                : 'Import Excel AOI dari WM untuk mulai mengelola QC kanal.'
            }
            cta={
              isAdmin && !q && status === 'semua' ? (
                <button className="btn btn-primary" onClick={() => setImportOpen(true)}>
                  <Icon name="upload" className="h-4 w-4" />
                  Import Excel AOI
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-8 px-3 py-2.5 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={sel.allChecked}
                      onChange={sel.toggleAll}
                      aria-label="Pilih semua"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left">Order No</th>
                  <th className="px-3 py-2.5 text-left">Canal ID</th>
                  <th className="px-3 py-2.5 text-left">District</th>
                  <th className="px-3 py-2.5 text-left">Contractor</th>
                  <th className="px-3 py-2.5 text-left">Request Date</th>
                  <th className="px-3 py-2.5 text-left">Deadline</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {canals.map((c, i) => (
                  <tr
                    key={c.orderNo}
                    className={`table-row transition ${sel.isSelected(c.orderNo) ? 'bg-brand-50/40' : ''}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={sel.isSelected(c.orderNo)}
                        onChange={(e) =>
                          sel.toggle(i, c.orderNo, (e.nativeEvent as MouseEvent).shiftKey)
                        }
                        aria-label={`Pilih ${c.orderNo}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to={`/undangan/${c.orderNo}`}
                        className="font-mono font-semibold text-slate-900 hover:text-brand-600"
                      >
                        {c.orderNo}
                      </Link>
                      <div className="text-[11px] text-slate-400">{c.requestType}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-mono font-semibold">{c.canalId}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.panjang}m · {c.dimensi}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{c.district}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm">{c.contractor}</div>
                      <div className="text-[11px] text-slate-400">{shortName(c.contractor)}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{fmtDate(c.requestDate)}</td>
                    <td className="px-3 py-3">
                      <DeadlineBadge requestDate={c.requestDate} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canals.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-3 text-xs text-slate-500">
            <div>
              Menampilkan {canals.length} dari {canalsQuery.data?.total ?? canals.length}
            </div>
            <div>Tip: shift+klik untuk pilih rentang baris.</div>
          </div>
        )}
      </div>

      <ImportExcelDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

export default UndanganList;
