/**
 * useClock — live clock tick per detik (demo touch: top nav HH:MM:SS + hari/tanggal).
 *
 * Demo ref: app.js `tickClock`. Format Indonesia: jam HH:MM:SS, tanggal "Sen · 13 Jun".
 */
import { useEffect, useState } from 'react';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export interface ClockValue {
  time: string; // "15:34:07"
  date: string; // "Sen · 13 Jun"
}

function format(now: Date): ClockValue {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    date: `${DAYS[now.getDay()]} · ${now.getDate()} ${MONTHS[now.getMonth()]}`,
  };
}

export function useClock(): ClockValue {
  const [value, setValue] = useState<ClockValue>(() => format(new Date()));
  useEffect(() => {
    const id = setInterval(() => setValue(format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return value;
}
