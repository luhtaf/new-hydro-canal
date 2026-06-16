/**
 * Placeholder — page kosong sementara untuk route yang slice fiturnya belum ada.
 *
 * Tiap slice fitur nanti GANTI route lazy-nya dengan komponen asli (lihat router.tsx).
 * Placeholder menampilkan empty-state premium + petunjuk slice mana yang mengisi.
 * JANGAN dipakai sebagai komponen final fitur.
 */
import { Icon } from './Icon.js';
import type { IconName } from '../lib/icon.js';

interface Props {
  title: string;
  icon?: IconName;
  feature?: string;
}

export function Placeholder({ title, icon = 'layout-dashboard', feature }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card">
      <div className="empty-state">
        <span className="empty-state-icon">
          <Icon name={icon} className="w-7 h-7" />
        </span>
        <h2 className="sec-title">{title}</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Halaman ini akan diisi oleh slice fitur
          {feature ? <span className="font-mono text-slate-700"> {feature}</span> : ''}. Shell
          (navigasi, tema, ⌘K, tour) sudah siap.
        </p>
      </div>
    </div>
  );
}

/** Factory komponen placeholder per route (dipakai router lazy). */
export function makePlaceholder(title: string, icon: IconName, feature?: string) {
  return function Page() {
    return <Placeholder title={title} icon={icon} feature={feature} />;
  };
}
