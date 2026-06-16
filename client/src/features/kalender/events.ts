/**
 * Logika domain kalender — turunkan event dari daftar Canal (AOI per-canal).
 *
 * 3 jenis event (warna sesuai demo + legenda view-kalender):
 *   - 'und' (Undangan, brand/cyan)  → Request Date AOI (kapan undangan masuk)
 *   - 'pen' (Penugasan, emerald)    → Measure Date / hari pengukuran operator
 *   - 'dl'  (Deadline, rose)        → Request Date + 4 hari (DOMAIN.md poin 1)
 *
 * Pure & no-React supaya bisa di-unit-test (lihat events.test.ts). Komponen page
 * konsumsi `buildMonthEvents` untuk peta hari→event + dot kalender.
 */
import type { Canal } from '../../shared/types.js';
import { deadlineInfo } from '../../shared/domain/deadline.js';

/** Jenis event kalender. Selaras dot/legend di demo view-kalender. */
export type EventKind = 'und' | 'pen' | 'dl';

/** 1 event di hari tertentu (untuk side panel "Detail hari"). */
export interface CalendarEvent {
  kind: EventKind;
  /** judul ringkas (mis. "Undangan SB180202 masuk"). */
  title: string;
  /** baris meta sekunder (kontraktor · distrik · konteks). */
  meta: string;
  /** canal sumber (untuk link detail). */
  canalId: string;
  /** tanggal event (lokal, di-truncate ke hari). */
  date: Date;
}

/** Urutan prioritas dot tunggal di sel kalender saat 1 hari punya >1 jenis. */
const KIND_PRIORITY: Record<EventKind, number> = { dl: 0, pen: 1, und: 2 };

/** Tone warna per jenis (dipakai dot + kartu side panel). Selaras palet demo. */
export const KIND_TONE: Record<EventKind, 'brand' | 'emerald' | 'rose'> = {
  und: 'brand',
  pen: 'emerald',
  dl: 'rose',
};

/** Label legenda Indonesia per jenis. */
export const KIND_LABEL: Record<EventKind, string> = {
  und: 'Undangan',
  pen: 'Penugasan',
  dl: 'Deadline',
};

/** Key hari lokal "YYYY-M-D" (tanpa padding) — stabil untuk peta event. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Parse tanggal ISO "YYYY-MM-DD" jadi Date lokal jam 00:00 (hindari geser TZ). */
function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  return new Date(y, mo, da);
}

/**
 * Bentuk semua event dari satu daftar canal. Tiap canal bisa memunculkan
 * sampai 3 event (undangan, deadline, penugasan).
 */
export function deriveEvents(canals: Canal[], now: Date = new Date()): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const c of canals) {
    const reqDate = parseLocalDate(c.requestDate);
    if (reqDate) {
      // Undangan masuk
      out.push({
        kind: 'und',
        title: `Undangan ${c.canalId} masuk`,
        meta: `${c.contractor} · ${c.district}`,
        canalId: c._id,
        date: reqDate,
      });
      // Deadline = requestDate + 4 hari (sinkron domain)
      const dl = deadlineInfo(reqDate, now);
      out.push({
        kind: 'dl',
        title: `Deadline QC ${c.canalId}`,
        meta: `${dl.label} · ${c.contractor}`,
        canalId: c._id,
        date: dl.deadline,
      });
    }
    // Penugasan: tampil jika sudah di-assign (punya measureDate lewat segment nanti;
    // sementara pakai startDate sebagai jadwal turun lapangan bila Assigned/In Progress).
    if (c.status === 'Assigned' || c.status === 'In Progress' || c.status === 'Done') {
      const penDate = parseLocalDate(c.startDate) ?? reqDate;
      if (penDate) {
        out.push({
          kind: 'pen',
          title: `QC ${c.canalId}${c.usv ? ` · ${c.usv}` : ''}`,
          meta: `${c.district} · ${c.panjang}m`,
          canalId: c._id,
          date: penDate,
        });
      }
    }
  }
  return out;
}

/** Hasil agregasi 1 bulan untuk render grid + side panel. */
export interface MonthEvents {
  /** key hari → daftar event (terurut: dl, pen, und). */
  byDay: Map<string, CalendarEvent[]>;
  /** key hari → jenis dominan untuk dot tunggal di sel. */
  dotByDay: Map<string, EventKind>;
}

/**
 * Saring event ke 1 bulan (year, monthIndex 0-11) lalu kelompokkan per hari.
 */
export function buildMonthEvents(
  events: CalendarEvent[],
  year: number,
  monthIndex: number,
): MonthEvents {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (e.date.getFullYear() !== year || e.date.getMonth() !== monthIndex) continue;
    const k = dayKey(e.date);
    const bucket = byDay.get(k);
    if (bucket) bucket.push(e);
    else byDay.set(k, [e]);
  }

  const dotByDay = new Map<string, EventKind>();
  for (const [k, list] of byDay) {
    // urut dalam hari + tentukan dot dominan
    list.sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]);
    const top = list[0];
    if (top) dotByDay.set(k, top.kind);
  }
  return { byDay, dotByDay };
}

/**
 * Susun grid bulan ala demo: minggu mulai Senin (Mon=0), kembalikan array sel.
 * `null` = sel kosong (offset awal bulan).
 */
export function buildMonthGrid(year: number, monthIndex: number): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  // getDay(): 0=Min..6=Sab. Geser ke Mon=0.
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}
