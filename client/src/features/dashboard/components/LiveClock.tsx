/**
 * LiveClock — jam hidup di header dashboard (demo touch "live clock").
 *
 * Demo ref: header `view-dashboard` menampilkan tanggal panjang + sapaan. Kita
 * tambah jam HH:MM:SS yang tick tiap detik (setInterval 1s) + tanggal lengkap
 * locale id-ID ("Senin, 11 Mei 2026"). Sapaan ("Selamat pagi/siang/sore/malam")
 * ikut jam supaya terasa hidup.
 *
 * Slice-local (cuma dipakai DashboardPage) → bukan kandidat shared (guardrail #1).
 * Beda dari `shared/hooks/useClock` (format pendek topnav); ini format panjang home.
 */
import { useEffect, useState } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';

const FULL_DATE = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const TIME = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function greeting(h: number): string {
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export interface LiveClockState {
  greeting: string;
  fullDate: string;
  time: string;
}

/** Hook tick 1 detik — kembalikan sapaan/tanggal/jam locale id-ID. */
export function useLiveClock(): LiveClockState {
  const compute = (): LiveClockState => {
    const now = new Date();
    return {
      greeting: greeting(now.getHours()),
      fullDate: FULL_DATE.format(now),
      time: TIME.format(now),
    };
  };
  const [state, setState] = useState<LiveClockState>(compute);
  useEffect(() => {
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  }, []);
  return state;
}

/** Chip jam hidup (tabular-nums supaya tidak goyang tiap tick). */
export function LiveClock({ time }: { time: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 tabular-nums">
      <Icon name="clock" className="h-3.5 w-3.5 text-slate-400" />
      {time}
    </span>
  );
}
