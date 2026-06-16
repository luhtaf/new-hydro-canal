/**
 * Barrel publik slice `kalender`. Router meng-impor `kalenderRoutes` dari sini.
 */
export { kalenderRoutes } from './routes.js';
export { default as KalenderPage } from './KalenderPage.js';

// Logika domain event (dipakai ulang dashboard "agenda minggu ini" bila perlu).
export {
  deriveEvents,
  buildMonthEvents,
  buildMonthGrid,
  dayKey,
  KIND_TONE,
  KIND_LABEL,
  type EventKind,
  type CalendarEvent,
  type MonthEvents,
} from './events.js';
export { useCalendarData } from './useCalendarData.js';
