/**
 * HelpPage (`/help`) — port demo view-help.
 *
 * Layout 3-kolom (2 konten + 1 aside sticky):
 *  - Keyboard shortcuts (tabel kbd)
 *  - Glossary istilah QC (sinkron DOMAIN.md)
 *  - FAQ collapsible (FaqAccordion)
 *  - Aside: Quick start CTA → walkthrough tour (shared tour-store), kontak, about.
 *
 * Semua "demo touch" relevan dipertahankan: kbd chip, gradient CTA, dark mode
 * (lewat class demo yang sudah punya override di globals.css).
 */
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { useTour, TOUR_STEPS } from '../../shared/layout/tour-store.js';
import { SHORTCUTS, GLOSSARY, FAQ, CONTACTS } from './content.js';
import { FaqAccordion } from './FaqAccordion.js';

/** Chip <kbd> ala command palette (reuse class `cmdk-kbd`). */
function Kbd({ label }: { label: string }) {
  return <span className="cmdk-kbd">{label}</span>;
}

export default function HelpPage() {
  const nav = useNavigate();
  const startTour = useTour((s) => s.start);

  // Tour menyorot elemen di dashboard/topnav → balik ke '/' dulu, baru start.
  const onStartTour = () => {
    nav('/');
    // beri waktu route transition mount sebelum spotlight nyari elemen.
    window.setTimeout(() => startTour(), 350);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bantuan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keyboard shortcuts, glossary istilah QC, dan FAQ.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Kolom konten */}
        <div className="space-y-4 lg:col-span-2">
          {/* Keyboard shortcuts */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="sec-title flex items-center gap-2 border-b border-slate-100 p-4">
              <Icon name="keyboard" className="h-5 w-5" />
              Keyboard shortcuts
            </div>
            <div className="grid gap-x-6 gap-y-1 p-4 text-sm sm:grid-cols-2">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.action}
                  className="flex items-center justify-between border-b border-slate-50 py-1.5"
                >
                  <span className="text-slate-600">{s.action}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <Kbd key={i} label={k} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Glossary */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="sec-title flex items-center gap-2 border-b border-slate-100 p-4">
              <Icon name="book-open" className="h-5 w-5" />
              Glossary istilah QC
            </div>
            <div className="divide-y divide-slate-100 p-4 text-sm">
              {GLOSSARY.map((g) => (
                <div
                  key={g.term + g.desc}
                  className="grid gap-1 py-2.5 sm:grid-cols-[148px_1fr] sm:gap-4"
                >
                  <span className="font-mono text-[13px] font-semibold text-brand-700">
                    {g.term}
                  </span>
                  <span
                    className={
                      g.mono
                        ? 'font-mono text-xs leading-relaxed text-slate-600'
                        : 'text-slate-600'
                    }
                  >
                    {g.desc}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="sec-title flex items-center gap-2 border-b border-slate-100 p-4">
              <Icon name="help-circle" className="h-5 w-5" />
              FAQ
            </div>
            <div className="p-4">
              <FaqAccordion items={FAQ} />
            </div>
          </section>
        </div>

        {/* Aside */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Quick start CTA → tour */}
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
              Quick start
            </div>
            <h3 className="mb-2 mt-1 text-lg font-bold">Mulai walkthrough</h3>
            <p className="mb-3 text-sm text-white/90">
              Tur {TOUR_STEPS.length}-step lihat semua fitur utama dalam 2 menit.
            </p>
            <button
              type="button"
              onClick={onStartTour}
              className="btn w-full justify-center bg-white text-brand-700"
            >
              <Icon name="presentation" className="h-4 w-4" />
              Mulai tour
            </button>
          </div>

          {/* Kontak */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="sec-title mb-3">Kontak</div>
            <div className="space-y-2 text-sm">
              {CONTACTS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="flex items-center gap-2 text-slate-600 hover:text-brand-600"
                >
                  <Icon name={c.icon} className="h-4 w-4" />
                  {c.label}
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-soft">
            <div className="mb-1 font-semibold text-slate-700">Tentang</div>
            HydroCanal QC v2.0 · ops
            <br />
            Stack: React + Vite + PouchDB + MongoDB
          </div>
        </aside>
      </div>
    </div>
  );
}
