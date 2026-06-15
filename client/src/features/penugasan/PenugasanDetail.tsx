/**
 * PenugasanDetail (`/penugasan/:canalId`) — port `renderPenugasanDetail` demo.
 *
 * :canalId = Canal.orderNo (identitas canonical). Isi:
 *  - header: canalId + status badge + deadline + link "Dari undangan" (→ /undangan/:orderNo)
 *  - info grid pekerjaan (Order/Type/District/Kontraktor/Panjang·Dimensi/MP/SPK/UTM/USV)
 *  - mini-map Leaflet 280px (UTM → lat/lng) + readout koordinat
 *  - progress: Parameter → Kedalaman → QC (state turunan dari `progress` API)
 *
 * Demo touches: tombol Cetak (window.print) + Mulai QC, mini-map pin, progress steps
 * berwarna (emerald=selesai, brand pulse=jalan, slate=menunggu). Visual restrained.
 *
 * Lucide non-barrel di-import langsung (slice-local, lihat shared/lib/icon.ts).
 */
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Hash, AlarmClock, FileText, Printer, Play, ChevronRight, Check, Clock,
  CloudSun, AlertTriangle, ArrowLeft, Mail,
} from 'lucide-react';
import { usePenugasanDetail } from './hooks.js';
import type { PenugasanDetail as Detail } from './api.js';
import { MiniMap } from './components/MiniMap.js';
import { TONE_TEXT, STATUS_BADGE } from './components/tone.js';
import { utmToLatLng } from '../../shared/domain/utm.js';

const ID_MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function fmtShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function PenugasanDetail() {
  const { canalId } = useParams<{ canalId: string }>();
  const { data, isLoading, isError, refetch } = usePenugasanDetail(canalId);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <DetailError onRetry={() => refetch()} />;

  return <DetailContent detail={data} />;
}

function DetailContent({ detail }: { detail: Detail }) {
  const c = detail.canal;
  const s = STATUS_BADGE[c.status] ?? STATUS_BADGE.Submitted!;
  const { lat, lng } = utmToLatLng(c.coordX, c.coordY);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4">
      <Link
        to="/penugasan"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Penugasan Saya
      </Link>

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {c.canalId}
            </h1>
            <span className={'badge ' + s.cls}>
              <span className={'badge-dot ' + s.dot} />
              {c.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {c.contractor} · {c.district}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Order No:
              {/* Dari undangan → detail undangan pakai orderNo */}
              <Link
                to={`/undangan/${c.orderNo}`}
                className="font-mono font-semibold text-brand-600 hover:underline"
              >
                {c.orderNo}
              </Link>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <AlarmClock className={'h-3 w-3 ' + TONE_TEXT[c.deadline.tone]} />
              <span className={'font-semibold ' + TONE_TEXT[c.deadline.tone]}>
                {c.deadline.label}
              </span>
            </span>
            {c.qcOutput && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Output:
                  <Link
                    to="/qc"
                    className="font-mono font-semibold text-brand-600 hover:underline"
                  >
                    {c.qcOutput}
                  </Link>
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Cetak
          </button>
          <Link to={`/lapangan/kedalaman/${c.orderNo}`} className="btn btn-primary">
            <Play className="h-4 w-4" />
            Mulai QC
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Info pekerjaan */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="sec-title border-b border-slate-100 p-4">Info pekerjaan</div>
            <div className="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-3">
              <Field label="Canal ID" mono value={c.canalId} />
              <Field label="Order No" mono value={c.orderNo} />
              <Field label="Request Type" value={c.requestType} />
              <Field label="District" value={c.district} />
              <Field label="Kontraktor" value={c.contractor} />
              <Field
                label="Panjang · Dimensi"
                value={`${c.panjang.toLocaleString('id-ID')} m · ${c.dimensi || '—'}`}
              />
              <Field label="Measure Point" mono value={c.measurePoint || '—'} />
              <Field
                label="SPK Start–Finish"
                value={`${fmtShort(c.startDate)} → ${fmtShort(c.finishDate)}`}
              />
              <Field
                label="Request Date"
                value={
                  <>
                    {fmtShort(c.requestDate)}{' '}
                    <span className={TONE_TEXT[c.deadline.tone]}>
                      ({c.deadline.label})
                    </span>
                  </>
                }
              />
              <Field label="USV" value={c.usv ?? '—'} />
              <Field
                label="Koordinat (UTM 48S)"
                mono
                value={`${c.coordX} / ${c.coordY}`}
              />
            </div>
          </div>

          {/* Lokasi mini-map */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="sec-title">Lokasi</div>
              <Link
                to="/peta"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Lihat di peta besar →
              </Link>
            </div>
            <MiniMap
              coordX={c.coordX}
              coordY={c.coordY}
              canalId={c.canalId}
              district={c.district}
            />
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 text-center text-xs">
              <div>
                <div className="text-slate-500">Latitude</div>
                <div className="mt-0.5 font-mono font-semibold">{lat.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-slate-500">Longitude</div>
                <div className="mt-0.5 font-mono font-semibold">{lng.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ProgressCard detail={detail} />
          <WeatherCard />
        </div>
      </div>
    </div>
  );
}

// ── Progress: Parameter → Kedalaman → QC ────────────────────────────────────────

function ProgressCard({ detail }: { detail: Detail }) {
  const { progress, canal } = detail;
  // Status tiap step diturunkan dari data progress + status canal.
  const paramDone = progress.hasParameter;
  const depthActive = paramDone && !progress.hasOutput;
  const depthDone = progress.hasOutput || canal.status === 'Done';
  const qcDone = progress.hasOutput || canal.status === 'Done';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="sec-title mb-3">Progress</div>
      <div className="space-y-3">
        <Step
          to={`/lapangan/parameter/${canal.orderNo}`}
          title="Parameter QC"
          state={paramDone ? 'done' : 'active'}
          sub={paramDone ? 'Lengkap' : 'Belum diisi · mulai dari sini'}
        />
        <Step
          to={`/lapangan/kedalaman/${canal.orderNo}`}
          title="Data kedalaman"
          state={depthDone ? 'done' : depthActive ? 'active' : 'todo'}
          sub={
            depthDone
              ? `${progress.depthPoints} titik`
              : depthActive
                ? `Sedang diproses · ${progress.depthPoints} titik`
                : 'Menunggu parameter'
          }
        />
        <Step
          title="QC Processing"
          state={qcDone ? 'done' : 'todo'}
          sub={qcDone ? (canal.qcOutput ?? 'Selesai') : 'Menunggu data lengkap'}
        />
      </div>
    </div>
  );
}

type StepState = 'done' | 'active' | 'todo';

function Step({
  to, title, sub, state,
}: { to?: string; title: string; sub: string; state: StepState }) {
  const box: Record<StepState, string> = {
    done: 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50',
    active: 'border-brand-300 bg-brand-50/30 hover:bg-brand-50',
    todo: 'border-slate-200 bg-slate-50 opacity-70',
  };
  const dot: Record<StepState, string> = {
    done: 'bg-emerald-500',
    active: 'bg-brand-500',
    todo: 'bg-slate-300',
  };
  const subTone: Record<StepState, string> = {
    done: 'text-emerald-700',
    active: 'text-brand-700',
    todo: 'text-slate-500',
  };

  const inner = (
    <div className="flex items-center gap-2.5">
      <div className={'grid h-7 w-7 place-items-center rounded-full text-white ' + dot[state]}>
        {state === 'done' ? (
          <Check className="h-3.5 w-3.5" />
        ) : state === 'active' ? (
          <span className="dot-pulse bg-white" style={{ width: 8, height: 8 }} />
        ) : (
          <Clock className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className={'text-xs ' + subTone[state]}>{sub}</div>
      </div>
      {to && <ChevronRight className="h-4 w-4 text-slate-400" />}
    </div>
  );

  const cls = 'block rounded-lg border-2 p-3 transition ' + box[state];
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function WeatherCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="sec-title mb-3">Cuaca</div>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-sky-200 to-sky-400 text-white shadow-soft">
          <CloudSun className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-slate-900">28°C</div>
          <div className="text-xs text-slate-500">Berawan · angin 12 km/j</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Potensi hujan setelah 14:00 — siapkan terpal.
      </div>
    </div>
  );
}

// ── Field cell ──────────────────────────────────────────────────────────────────

function Field({
  label, value, mono,
}: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={'mt-0.5 font-semibold text-slate-800 ' + (mono ? 'font-mono' : '')}>
        {value}
      </div>
    </div>
  );
}

// ── states ──────────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4">
      <div className="h-5 w-40 rounded bg-slate-200 shimmer" />
      <div className="h-8 w-56 rounded bg-slate-200 shimmer" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-white shadow-soft shimmer lg:col-span-2" />
        <div className="h-80 rounded-xl bg-white shadow-soft shimmer" />
      </div>
    </div>
  );
}

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="rounded-xl border border-rose-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-500">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">
          Penugasan tidak ditemukan
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Mungkin sudah di-unassign atau koneksi bermasalah.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button className="btn btn-ghost" onClick={onRetry}>
            Coba lagi
          </button>
          <Link to="/penugasan" className="btn btn-primary">
            Kembali ke daftar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PenugasanDetail;
