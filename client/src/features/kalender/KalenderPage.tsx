/**
 * KalenderPage (`/kalender`) — port demo view-kalender + renderCalendar + renderDaySidebar.
 *
 * Month grid (minggu mulai Senin) dengan dot event color-coded, klik tanggal →
 * side panel "Detail hari" berisi daftar event (undangan/penugasan/deadline).
 * Toggle Bulan/Minggu/Hari hadir (Minggu & Hari TBD post-MVP, PLAN-FE) + navigasi
 * bulan prev/next. Visual: kartu putih, grid-cal/cal-cell dari globals.css (port style.css).
 *
 * Data: sementara dari useCalendarData (sample), nanti diganti query canal nyata.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import type { EventKind, CalendarEvent } from './events.js';
import {
  deriveEvents,
  buildMonthEvents,
  buildMonthGrid,
  dayKey,
  KIND_LABEL,
} from './events.js';
import { useCalendarData } from './useCalendarData.js';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const WEEKDAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAYNAME_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Dot warna sel — static class (Tailwind JIT tak bisa dynamic). */
const DOT_BG: Record<EventKind, string> = {
  und: 'bg-brand-500',
  pen: 'bg-emerald-500',
  dl: 'bg-rose-500',
};

/** Kartu event di side panel — static class per tone. */
const CARD_TONE: Record<EventKind, { dot: string; hover: string }> = {
  und: { dot: 'bg-brand-500', hover: 'hover:border-brand-300 hover:bg-brand-50/50' },
  pen: { dot: 'bg-emerald-500', hover: 'hover:border-emerald-300 hover:bg-emerald-50/50' },
  dl: { dot: 'bg-rose-500', hover: 'hover:border-rose-300 hover:bg-rose-50/50' },
};

type ViewMode = 'bulan' | 'minggu' | 'hari';

export default function KalenderPage() {
  const nav = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState<string | null>(() => dayKey(now));
  const [view, setView] = useState<ViewMode>('bulan');

  const canals = useCalendarData(now);
  const events = useMemo(() => deriveEvents(canals, now), [canals, now]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const { byDay, dotByDay } = useMemo(
    () => buildMonthEvents(events, year, month),
    [events, year, month],
  );
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const todayKey = dayKey(now);
  const selectedEvents: CalendarEvent[] =
    (selectedKey && byDay.get(selectedKey)) || [];
  const selectedDate = selectedKey ? parseKey(selectedKey) : null;

  const totalThisMonth = useMemo(() => {
    let n = 0;
    for (const list of byDay.values()) n += list.length;
    return n;
  }, [byDay]);

  const shiftMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setSelectedKey(null);
  };

  const ViewBtn = ({ id, label }: { id: ViewMode; label: string }) => (
    <button
      type="button"
      onClick={() => setView(id)}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
        view === id
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Kalender
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Jadwal undangan, penugasan, dan deadline QC.
            <span className="ml-1 text-slate-400">
              · {totalThisMonth} agenda di {MONTHS_ID[month]} {year}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-soft">
            <ViewBtn id="bulan" label="Bulan" />
            <ViewBtn id="minggu" label="Minggu" />
            <ViewBtn id="hari" label="Hari" />
          </div>
          <button
            type="button"
            onClick={() => nav('/undangan/baru')}
            className="btn btn-primary"
          >
            <Icon name="plus" className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </header>

      {view !== 'bulan' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-10 text-center">
          <Icon
            name="calendar-clock"
            className="h-8 w-8 mx-auto mb-3 text-slate-300"
          />
          <div className="text-sm font-medium text-slate-700">
            Tampilan {view === 'minggu' ? 'Minggu' : 'Hari'} segera hadir
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Untuk sekarang gunakan tampilan Bulan untuk melihat semua agenda.
          </p>
          <button
            type="button"
            onClick={() => setView('bulan')}
            className="btn btn-ghost mt-4"
          >
            Kembali ke Bulan
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Month grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Bulan sebelumnya"
                  onClick={() => shiftMonth(-1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <Icon name="chevron-left" className="h-4 w-4" />
                </button>
                <div className="font-bold text-lg text-slate-900 tabular-nums min-w-[8rem] text-center">
                  {MONTHS_ID[month]} {year}
                </div>
                <button
                  type="button"
                  aria-label="Bulan berikutnya"
                  onClick={() => shiftMonth(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <Icon name="chevron-right" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedKey(dayKey(now));
                  }}
                  className="btn btn-ghost input-sm ml-1"
                >
                  Hari ini
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                {(['und', 'pen', 'dl'] as EventKind[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${DOT_BG[k]}`} />
                    {KIND_LABEL[k]}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3">
              <div className="grid-cal mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {WEEKDAYS_ID.map((w) => (
                  <div key={w} className="text-center p-1">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid-cal" role="grid" aria-label={`Kalender ${MONTHS_ID[month]} ${year}`}>
                {grid.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} />;
                  const k = dayKey(new Date(year, month, d));
                  const isToday = k === todayKey;
                  const isSel = k === selectedKey;
                  const dot = dotByDay.get(k);
                  const count = byDay.get(k)?.length ?? 0;
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setSelectedKey(k)}
                      aria-pressed={isSel}
                      aria-label={`${d} ${MONTHS_ID[month]}${count ? `, ${count} agenda` : ''}`}
                      className={`cal-cell text-left ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}`}
                    >
                      <div
                        className={`text-xs font-semibold ${
                          isToday ? 'text-brand-700' : 'text-slate-700'
                        }`}
                      >
                        {d}
                      </div>
                      {dot && (
                        <div className="mt-auto flex items-center gap-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT_BG[dot]}`} />
                          {count > 1 && (
                            <span className="text-[10px] font-medium text-slate-400 leading-none">
                              {count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day side panel */}
          <aside className="bg-white rounded-xl border border-slate-200 shadow-soft p-4 self-start">
            <div className="sec-title mb-3">Detail hari</div>
            {!selectedDate ? (
              <div className="text-center text-slate-400 py-8 text-sm">
                <Icon
                  name="mouse-pointer-click"
                  className="h-7 w-7 mx-auto mb-2"
                />
                Pilih tanggal di kalender untuk melihat agenda hari itu.
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-3">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {selectedDate.getDate()}
                  </div>
                  <div className="text-sm text-slate-500">
                    {DAYNAME_ID[selectedDate.getDay()]}, {MONTHS_ID[selectedDate.getMonth()]}{' '}
                    {selectedDate.getFullYear()}
                  </div>
                </div>
                {selectedEvents.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-6">
                    Tidak ada agenda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((e, idx) => {
                      const tone = CARD_TONE[e.kind];
                      return (
                        <button
                          type="button"
                          key={`${e.canalId}-${e.kind}-${idx}`}
                          onClick={() => nav(`/penugasan/${e.canalId}`)}
                          className={`w-full text-left p-3 rounded-lg border border-slate-200 transition ${tone.hover}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`badge-dot mt-1.5 ${tone.dot}`}
                              aria-hidden
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-slate-900 truncate">
                                {e.title}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mr-1.5">
                                  {KIND_LABEL[e.kind]}
                                </span>
                                {e.meta}
                              </div>
                            </div>
                            <Icon
                              name="chevron-right"
                              className="h-4 w-4 text-slate-300 shrink-0 mt-0.5"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/** Parse dayKey "Y-M-D" balik ke Date lokal. */
function parseKey(k: string): Date | null {
  const parts = k.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return null;
  return new Date(y, m, d);
}
