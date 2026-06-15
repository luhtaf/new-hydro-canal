/**
 * PenugasanList (`/penugasan`) — port `renderPenugasan` demo.
 *
 * Tab Aktif/Selesai → grouping Kontraktor → Distrik → CanalCard, dengan chip ringkasan
 * (jumlah kanal · total meter · deadline terdekat) di header tiap kontraktor + sub-chip
 * per distrik (DOMAIN.md poin 2 — jawaban WM multi-distrik/kontraktor).
 *
 * Demo touches dipertahankan: info banner brand, hover lift kartu, badge status berdot,
 * skeleton/empty state, deadline tone berwarna. Visual restrained ala Linear/Stripe:
 * section abu lembut, satu aksen brand, data-density tinggi.
 *
 * Lucide: ikon di luar barrel shell di-import langsung di sini (slice-local; barrel shell
 * sengaja minimal untuk tree-shaking — lihat shared/lib/icon.ts).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, MapPin, Hash, Ruler, Navigation, AlarmClock, ArrowRight,
  ClipboardCheck, Info,
} from 'lucide-react';
import { useMinePenugasan } from './hooks.js';
import type { PenugasanCanal, PenugasanContractor, PenugasanTab } from './api.js';
import { TONE_BADGE, TONE_DOT, TONE_TEXT, STATUS_BADGE } from './components/tone.js';

const TABS: { id: PenugasanTab; label: string }[] = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'selesai', label: 'Selesai' },
];

const idNum = (n: number) => n.toLocaleString('id-ID');

export function PenugasanList() {
  const [tab, setTab] = useState<PenugasanTab>('aktif');
  const { data, isLoading, isError, refetch } = useMinePenugasan(tab);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Penugasan Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kanal yang ditugaskan ke kamu, dikelompokkan per kontraktor &amp; distrik.
          </p>
        </div>
        {/* Tab Aktif / Selesai */}
        <div
          role="tablist"
          className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-soft"
        >
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={
                  'rounded-md px-3.5 py-1.5 text-sm font-semibold transition ' +
                  (on
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:text-slate-700')
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Info banner — port demo */}
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p className="text-brand-900">
          Penugasan dikelompokkan per <b>Kontraktor → Distrik</b>. Satu operator bisa
          pegang beberapa kontraktor &amp; distrik sekaligus dalam satu waktu.
        </p>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorBox onRetry={() => refetch()} />
      ) : !data || data.groups.length === 0 ? (
        <EmptyBox tab={tab} />
      ) : (
        <div className="space-y-4">
          {data.groups.map((g) => (
            <ContractorSection key={g.contractor} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContractorSection({ group }: { group: PenugasanContractor }) {
  const { summary } = group;
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      {/* Header kontraktor + chip ringkasan */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-slate-900">{group.contractor}</div>
          <div className="text-xs text-slate-500">
            {group.shortName} · {summary.districtCount} distrik
          </div>
        </div>
        <span className="badge border border-slate-200 bg-white text-slate-700">
          {summary.canalCount} kanal
        </span>
        <span className="badge border border-slate-200 bg-white text-slate-700">
          {idNum(summary.totalMeter)} m
        </span>
        <span className={'badge ' + TONE_BADGE[summary.nearest.tone]}>
          <span className={'badge-dot ' + TONE_DOT[summary.nearest.tone]} />
          {summary.nearest.label}
        </span>
      </div>

      {/* Sub-group per distrik */}
      {group.districts.map((d) => (
        <div key={d.district} className="mt-3">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {d.district}
            <span className="font-normal text-slate-400">
              · {d.canals.length} kanal · {idNum(d.totalMeter)} m
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.canals.map((c) => (
              <CanalCard key={c.orderNo} canal={c} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function CanalCard({ canal: c }: { canal: PenugasanCanal }) {
  const s = STATUS_BADGE[c.status] ?? STATUS_BADGE.Submitted!;
  return (
    <Link
      to={`/penugasan/${c.orderNo}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono font-bold text-slate-900">{c.canalId}</div>
        <span className={'badge ' + s.cls}>
          <span className={'badge-dot ' + s.dot} />
          {c.status}
        </span>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Hash className="h-3.5 w-3.5 shrink-0" />
          Order {c.orderNo}
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Ruler className="h-3.5 w-3.5 shrink-0" />
          {idNum(c.panjang)} m · {c.dimensi} · MP {c.measurePoint}
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Navigation className="h-3.5 w-3.5 shrink-0" />
          {c.coordX} / {c.coordY}
        </div>
        <div className="flex items-center gap-2">
          <AlarmClock className={'h-3.5 w-3.5 shrink-0 ' + TONE_TEXT[c.deadline.tone]} />
          <span className={'font-semibold ' + TONE_TEXT[c.deadline.tone]}>
            {c.deadline.label}
          </span>
          <span className="text-xs text-slate-400">
            (SPK s/d {fmtShort(c.finishDate)})
          </span>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
        Lihat detail <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

const ID_MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function fmtShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]}`;
}

// ── states (slice-local) ───────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-200 shimmer" />
            <div className="h-4 w-48 rounded bg-slate-200 shimmer" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-32 rounded-xl bg-white shadow-soft shimmer" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyBox({ tab }: { tab: PenugasanTab }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
        <ClipboardCheck className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">
        Tidak ada penugasan {tab}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Cek tab lainnya atau tunggu assign dari admin.
      </p>
    </div>
  );
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-slate-800">Gagal memuat penugasan</h3>
      <p className="mt-1 text-sm text-slate-500">Periksa koneksi lalu coba lagi.</p>
      <button className="btn btn-ghost mt-4" onClick={onRetry}>
        Coba lagi
      </button>
    </div>
  );
}

export default PenugasanList;
