/**
 * ChartCanvas — bridge React ⇄ Chart.js v4 imperatif (dep `chart.js` ada;
 * `react-chartjs-2` TIDAK ada di package.json → kita drive Chart langsung, sama
 * seperti demo `renderReports`). Pakai `Chart` auto-register (`chart.js/auto`).
 *
 * Lifecycle: buat instance saat mount/`config` ganti, `.destroy()` saat unmount
 * (cegah leak + "canvas already in use"). Container fix-height (chart pakai
 * maintainAspectRatio:false) supaya tinggi ditentukan parent, bukan rasio.
 */
import { useEffect, useRef } from 'react';
import Chart, { type ChartConfiguration } from 'chart.js/auto';

interface Props {
  config: ChartConfiguration;
  /** tinggi kontainer (chart responsif lebar penuh). */
  height?: number;
  ariaLabel?: string;
}

export function ChartCanvas({ config, height = 220, ariaLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // Re-create saat config berubah (data/period). Identitas config = trigger.
  }, [config]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  );
}
