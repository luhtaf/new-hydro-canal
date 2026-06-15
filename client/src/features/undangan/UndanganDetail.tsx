/**
 * UndanganDetail (`/undangan/:orderNo`) — port demo `view-undangan-detail` +
 * `renderUndanganDetail`.
 *
 * Header (Order No + status + deadline) · 3-card AOI · grid semua field AOI ·
 * "Canal lain di kontraktor/distrik sama" (siblings) · acuan deadline · timeline.
 */
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { shortName } from '../../shared/domain/shortName.js';
import { deadlineInfo } from '../../shared/domain/deadline.js';
import { useRole } from '../auth/hooks.js';
import type { Canal } from '../../shared/types.js';
import { useCanal } from './hooks.js';
import { DeadlineBadge, StatusBadge } from './components/badges.js';
import { AoiHeaderCards } from './components/AoiHeaderCards.js';
import { TableSkeleton, ErrorState, EmptyState } from './components/states.js';

function fmtIso(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-0.5 font-semibold ${mono ? 'font-mono' : ''}`}>{children}</div>
    </div>
  );
}

export function UndanganDetail() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const { isAdmin } = useRole();
  const { data, isLoading, isError, refetch } = useCanal(orderNo);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <TableSkeleton rows={8} cols={3} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <EmptyState icon="mail" heading="Undangan tidak ditemukan" sub={`Order No ${orderNo ?? ''} tidak ada.`} cta={<Link to="/undangan" className="btn btn-primary">Kembali ke daftar</Link>} />
      </div>
    );
  }

  const { canal: u, siblings, aoi } = data;
  const dl = deadlineInfo(new Date(u.requestDate));
  const dlIso = dl.deadline.toISOString().slice(0, 10);
  const operatorLabel = u.assignedTo ? `${u.assignedTo}${u.usv ? ` (${u.usv})` : ''}` : 'Belum di-assign';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/undangan" className="hover:text-slate-900">Undangan</Link>
        <Icon name="chevron-right" className="h-3 w-3" />
        <span className="font-mono font-medium text-slate-900">{u.orderNo}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight">{u.orderNo}</h1>
            <StatusBadge status={u.status} />
            <DeadlineBadge requestDate={u.requestDate} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {u.contractor} · {u.district} · Canal <span className="font-mono">{u.canalId}</span>
          </p>
        </div>
        <div className="no-print flex gap-2">
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="printer" className="h-4 w-4" />
            Cetak
          </button>
          {isAdmin && (
            <button className="btn btn-primary">
              <Icon name="user-plus" className="h-4 w-4" />
              Assign petugas
            </button>
          )}
        </div>
      </header>

      <AoiHeaderCards
        region={aoi?.region ?? 'Palembang'}
        area={aoi?.area ?? 'SUMSEL P1'}
        vendor={aoi?.vendor ?? 'PT. KARTA BHUMI NUSANTARA'}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="sec-title border-b border-slate-100 p-4">Detail AOI / Order</div>
            <div className="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-3">
              <Field label="Order No" mono>{u.orderNo}</Field>
              <Field label="Canal ID" mono>{u.canalId}</Field>
              <Field label="Request Type">{u.requestType}</Field>
              <Field label="District">{u.district}</Field>
              <Field label="Contractor">
                {u.contractor} <span className="font-normal text-slate-400">· {shortName(u.contractor)}</span>
              </Field>
              <Field label="Panjang · Dimensi">{u.panjang} m · {u.dimensi}</Field>
              <Field label="Measure Point" mono>{u.measurePoint}</Field>
              <Field label="Coordinate X / Y (UTM)" mono>{u.coordX} / {u.coordY}</Field>
              <Field label="Status">{u.status}</Field>
              <Field label="Request Date">{fmtIso(u.requestDate)}</Field>
              <Field label="SPK Start → Finish">{fmtIso(u.startDate)} → {fmtIso(u.finishDate)}</Field>
              <div>
                <div className="text-xs text-slate-500">Deadline (req+5hr)</div>
                <div className={`mt-0.5 font-semibold text-${dl.tone}-600`}>{dlIso} · {dl.label}</div>
              </div>
              <Field label="Operator / USV">{operatorLabel}</Field>
              {u.qcOutput && (
                <div>
                  <div className="text-xs text-slate-500">QC Output</div>
                  <div className="mt-0.5 font-mono font-semibold text-brand-600">{u.qcOutput}</div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="sec-title">Canal lain · {shortName(u.contractor)} / {u.district}</div>
              <span className="text-xs text-slate-500">{siblings.length} canal lain</span>
            </div>
            {siblings.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">
                Tidak ada canal lain di kombinasi kontraktor/distrik ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {siblings.map((x: Canal) => (
                  <Link
                    key={x.orderNo}
                    to={`/undangan/${x.orderNo}`}
                    className="flex items-center gap-3 p-3.5 hover:bg-slate-50"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 font-mono text-[10px] font-bold text-slate-500">
                      {x.canalId.slice(-3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-semibold">
                        {x.canalId}{' '}
                        <span className="font-sans font-normal text-slate-400">· order {x.orderNo}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {x.panjang}m · {x.dimensi} · MP {x.measurePoint}
                      </div>
                    </div>
                    <StatusBadge status={x.status} />
                    <Icon name="chevron-right" className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="sec-title mb-3">Acuan deadline</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Request Date</span>
                <span className="font-semibold">{fmtIso(u.requestDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maks proses</span>
                <span className="font-semibold">5 hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deadline</span>
                <span className={`font-semibold text-${dl.tone}-600`}>{dlIso}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 text-xs text-slate-500">
                Hari undangan masuk dihitung sebagai hari ke-1 (total window 5 hari).
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="sec-title mb-3">Timeline</div>
            <div className="relative space-y-3 pl-5">
              <div className="absolute bottom-2 left-1.5 top-2 w-px bg-slate-200" />
              <TimelineNode active title="AOI diterima dari WM" meta={fmtIso(u.requestDate)} done />
              <TimelineNode active={!!u.assignedTo} title="Assign petugas" meta={operatorLabel} />
              <TimelineNode active={!!u.qcOutput} title="QC selesai & output" meta={u.qcOutput || '—'} done={!!u.qcOutput} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineNode({
  active,
  done,
  title,
  meta,
}: {
  active: boolean;
  done?: boolean;
  title: string;
  meta: string;
}) {
  const dot = done ? 'bg-emerald-500 ring-emerald-100' : active ? 'bg-brand-500 ring-brand-100' : 'bg-slate-300 ring-slate-100';
  return (
    <div className="relative">
      <span className={`absolute -left-3.5 top-1 h-2.5 w-2.5 rounded-full ring-4 ${dot}`} />
      <div className={`text-sm font-semibold ${active ? '' : 'text-slate-500'}`}>{title}</div>
      <div className="text-xs text-slate-500">{meta}</div>
    </div>
  );
}

export default UndanganDetail;
