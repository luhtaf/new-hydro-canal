/**
 * SplashScreen — fallback Suspense + boot splash.
 *
 * Demo touch: splash di-suppress saat URL match `viewdata` (port chart/data legacy
 * yang dibuka standalone tanpa chrome). Logo droplets + brand gradient + spinner halus.
 */
import { Icon } from './Icon.js';

/** Path yang menonaktifkan splash (legacy chart/data viewer). */
export function isSplashSuppressed(pathname: string = window.location.pathname): boolean {
  return /viewdata/i.test(pathname) || /viewdata/i.test(window.location.search);
}

export function SplashScreen() {
  if (isSplashSuppressed()) return null;
  return (
    <div className="min-h-[70vh] grid place-items-center animate-fade">
      <div className="flex flex-col items-center gap-4">
        <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center shadow-pop animate-pulse-dot">
          <Icon name="droplets" className="w-8 h-8 text-white" />
        </span>
        <div className="text-center">
          <div className="font-bold text-slate-900 tracking-tight">HydroCanal QC</div>
          <div className="text-xs text-slate-500 mt-0.5">Memuat…</div>
        </div>
      </div>
    </div>
  );
}
