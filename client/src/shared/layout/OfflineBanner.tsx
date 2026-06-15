/**
 * OfflineBanner — banner kuning slide-down saat offline (demo touch).
 *
 * Demo ref: index.html #offline-banner. Tampil hanya saat `!online`. Menunjukkan
 * jumlah perubahan tertunda (queue) dengan dot pulse.
 */
import { useUi } from '../stores/ui.js';
import { Icon } from './Icon.js';

export function OfflineBanner() {
  const online = useUi((s) => s.online);
  const queueLen = useUi((s) => s.queue.length);
  if (online) return null;
  return (
    <div
      id="offline-banner"
      className="sticky top-0 z-50 bg-amber-50 border-b border-amber-300 text-amber-900 text-sm animate-slide-down"
      role="status"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <Icon name="cloud-off" className="w-4 h-4 shrink-0" />
        <span className="font-medium">Mode offline aktif.</span>
        <span className="hidden sm:inline text-amber-700">
          Perubahan disimpan lokal &amp; akan disinkronkan saat online kembali.
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-200/70 px-2 py-1 rounded-full">
          <span className="badge-dot bg-amber-500 animate-pulse-dot" />
          {queueLen} tertunda
        </span>
      </div>
    </div>
  );
}
