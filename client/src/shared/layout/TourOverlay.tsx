/**
 * TourOverlay — walkthrough 8-step dengan spotlight + tooltip card follow.
 *
 * Demo ref: app.js showTourStep + index.html #tour. Spotlight memakai box-shadow
 * inset besar (globals.css .tour-spotlight). Card di-posisikan relatif ke target.
 * Saat step butuh route lain (`go`), navigasi dulu lalu hitung posisi setelah jeda.
 * Render via Portal. ESC / klik backdrop = tutup.
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS } from './tour-store.js';
import { Icon } from './Icon.js';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const CARD_W = 340;
const CARD_H = 188;

export function TourOverlay() {
  const active = useTour((s) => s.active);
  const index = useTour((s) => s.index);
  const next = useTour((s) => s.next);
  const prev = useTour((s) => s.prev);
  const end = useTour((s) => s.end);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [spot, setSpot] = useState<Box | null>(null);
  const [card, setCard] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const step = TOUR_STEPS[index];

  // Navigasi ke route step (kalau perlu) sebelum mengukur.
  useEffect(() => {
    if (!active || !step?.go) return;
    if (pathname !== step.go) navigate(step.go);
  }, [active, step, pathname, navigate]);

  // ESC tutup.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, end, next, prev]);

  // Hitung posisi spotlight + card. Jeda kalau baru pindah route.
  useLayoutEffect(() => {
    if (!active || !step) return;
    let raf = 0;
    const measure = () => {
      const target = document.querySelector(step.sel) as HTMLElement | null;
      if (!target) {
        setSpot(null);
        setCard({
          left: window.innerWidth / 2 - CARD_W / 2,
          top: window.innerHeight * 0.4,
        });
        return;
      }
      const r = target.getBoundingClientRect();
      const pad = 8;
      setSpot({
        left: r.left - pad,
        top: r.top - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
      let cx = r.left + r.width / 2 - CARD_W / 2;
      let cy = r.bottom + 16;
      if (cy + CARD_H > window.innerHeight - 16) cy = r.top - CARD_H - 16;
      if (cx < 16) cx = 16;
      if (cx + CARD_W > window.innerWidth - 16) cx = window.innerWidth - CARD_W - 16;
      if (cy < 16) cy = 16;
      setCard({ left: cx, top: cy });
    };
    // beri waktu DOM render setelah route change
    const delay = step.go && pathname !== step.go ? 260 : 40;
    const t = setTimeout(() => {
      raf = requestAnimationFrame(measure);
    }, delay);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [active, step, index, pathname]);

  if (!active || !step || typeof document === 'undefined') return null;

  const isLast = index === TOUR_STEPS.length - 1;

  return createPortal(
    <div className="no-print">
      <div className="tour-backdrop" onClick={end} />
      {spot && (
        <div
          className="tour-spotlight"
          style={{
            left: spot.left,
            top: spot.top,
            width: spot.width,
            height: spot.height,
          }}
        />
      )}
      <div className="tour-card" style={{ left: card.left, top: card.top }}>
        <div className="flex items-center justify-between">
          <span className="tour-step">
            {index + 1} dari {TOUR_STEPS.length}
          </span>
          <button onClick={end} className="text-slate-400 hover:text-slate-700" aria-label="Tutup tour">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="flex items-center justify-between">
          <div className="tour-dots">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`tour-dot ${i === index ? 'active' : ''}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost text-xs"
              onClick={prev}
              disabled={index === 0}
              style={{ opacity: index === 0 ? 0.4 : 1 }}
            >
              Sebelumnya
            </button>
            <button className="btn btn-primary text-xs" onClick={next}>
              {isLast ? 'Selesai' : 'Lanjut'}
              <Icon name={isLast ? 'check' : 'arrow-right'} className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
