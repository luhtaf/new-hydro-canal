/**
 * MiniDepthChart — sparkline bar kedalaman untuk kartu output (grid /qc).
 *
 * Render ringan (div bars, bukan Chart.js penuh) — port demo `renderMiniCharts`
 * (depth-bar / depth-track) tapi data nyata: tiap bar = |displayed depth|, warna =
 * klasifikasi threshold (pass/tol/fail) via shared/domain. Tidak interaktif; untuk
 * chart drag penuh pakai DepthChart slice [data].
 */
import { useThreshold } from '../data/index.js';
import { depthColor } from '../data/index.js';

interface Props {
  /** displayed depths (negatif, hasil finalDepth). */
  mini: number[];
  className?: string;
}

export function MiniDepthChart({ mini, className }: Props) {
  const { threshold } = useThreshold();
  if (mini.length === 0) {
    return (
      <div
        className={`grid place-items-center rounded-lg bg-slate-50 text-[11px] text-slate-400 ${className ?? ''}`}
      >
        belum ada titik kedalaman
      </div>
    );
  }
  // Normalisasi tinggi pakai magnitude max supaya bar terpakai penuh.
  const mags = mini.map((v) => Math.abs(v));
  const max = Math.max(...mags, 0.001);
  const n = mini.length;
  const w = 100 / n;

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-b from-slate-50 to-white ${className ?? ''}`}
      role="img"
      aria-label="Sparkline kedalaman"
    >
      {mini.map((v, i) => {
        const h = (Math.abs(v) / max) * 100;
        return (
          <div
            key={i}
            className="absolute bottom-0 rounded-t-[1px]"
            style={{
              left: `${i * w}%`,
              width: `${w * 0.82}%`,
              height: `${Math.max(4, h)}%`,
              background: depthColor(v, threshold),
              opacity: 0.92,
            }}
          />
        );
      })}
    </div>
  );
}
