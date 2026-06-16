/**
 * PengaturanPage — route `/pengaturan`. Port demo `view-pengaturan` + renderPengaturan.
 *
 * Tiga section:
 *   - Threshold pengukuran (admin-only; operator lihat read-only/terkunci) — slider
 *     live re-color chart + 4 input numeric + preview legend. (DOMAIN.md poin 5)
 *   - Akun — profil read-only + toggle sinkron otomatis & gembok app (app-lock [auth]).
 *   - Penyimpanan lokal — statistik PouchDB real + Sinkron paksa / Ekspor / Reset lokal.
 *
 * Default export → diwire di router sebagai `/pengaturan` (lihat field wiring).
 * Visual premium: grid 2-kolom, palet restrained + aksen brand, Lucide 1 weight.
 */
import { ThresholdSection } from './components/ThresholdSection.js';
import { AkunSection } from './components/AkunSection.js';
import { LokalSection } from './components/LokalSection.js';

export default function PengaturanPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-slate-600 mt-1">Threshold QC, akun &amp; perangkat, dan penyimpanan lokal.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <ThresholdSection />
        <AkunSection />
        <LokalSection />
      </div>
    </div>
  );
}
