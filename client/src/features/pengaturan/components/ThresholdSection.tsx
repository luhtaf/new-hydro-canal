/**
 * ThresholdSection — section Threshold pengukuran (DOMAIN.md poin 5).
 *
 * Isi (port demo view-pengaturan blok threshold + renderPengaturan):
 *   - Slider "Lulus ≥" live → re-color chart kedalaman realtime (geser batasAkhir,
 *     dan batasAwal mengikuti tidakLulus, persis demo).
 *   - 4 input numeric: lulus / tidakLulus / batasAwal / batasAkhir.
 *   - Preview legend (ThresholdLegend) + DepthChart sample yang re-color saat
 *     threshold berubah (konsumen DepthChart dari slice [data], read-only).
 *   - Admin-only: untuk operator section dikunci (lock-overlay + lock badge),
 *     tunduk juga ke app-lock toggle "Hanya admin yang dapat edit" dari [auth].
 *
 * Sumber state: useThresholdEditor (draft lokal + mutation server).
 */
import { Lock } from 'lucide-react';
import { Icon } from '../../../shared/layout/Icon.js';
import { DepthChart } from '../../data/index.js';
import { useRole } from '../../auth/hooks.js';
import {
  useThresholdEditor,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
} from '../hooks.js';
import { SectionCard } from './SectionCard.js';
import { ThresholdLegend } from './ThresholdLegend.js';
import { SAMPLE_SEGMENT, SAMPLE_POINTS } from './sampleDepth.js';
import type { Threshold } from '../../../shared/types.js';

const SLIDER_MIN = Math.round(THRESHOLD_MIN * 1000);
const SLIDER_MAX = Math.round(THRESHOLD_MAX * 1000);

/** Input numeric 3-desimal untuk 1 field threshold. */
function NumField({
  label,
  value,
  onCommit,
  disabled,
}: {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <input
        type="number"
        step="0.05"
        min={THRESHOLD_MIN}
        max={THRESHOLD_MAX}
        disabled={disabled}
        defaultValue={value.toFixed(3)}
        // key memaksa re-mount saat value server/slider berubah → input ikut sinkron.
        key={value}
        onBlur={(e) => {
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onCommit(n);
        }}
        className="input mt-1.5 font-mono"
      />
    </div>
  );
}

export function ThresholdSection() {
  const { isAdmin } = useRole();
  const ed = useThresholdEditor();
  const t = ed.draft;
  const locked = !isAdmin;

  return (
    <SectionCard
      title="Threshold pengukuran"
      wide
      action={
        locked ? (
          <span className="lock-badge" style={{ display: 'inline-flex' }}>
            <Lock className="w-3 h-3" strokeWidth={2} />
            Admin-only
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-brand-600 font-mono inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            live
          </span>
        )
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kiri: kontrol */}
        <div className={`space-y-4 text-sm ${locked ? 'lock-overlay rounded-lg' : ''}`}>
          <div>
            <label className="text-xs font-semibold text-slate-700 flex justify-between">
              Lulus ≥ (m)
              <span className="font-mono text-brand-600">{t.lulus.toFixed(3)}</span>
            </label>
            <input
              type="range"
              className="range-brand w-full mt-2"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={50}
              value={Math.round(t.lulus * 1000)}
              disabled={locked}
              onChange={(e) => ed.setLulusFromSlider(parseInt(e.target.value, 10) / 1000)}
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>{THRESHOLD_MIN.toFixed(3)}</span>
              <span>{((THRESHOLD_MIN + THRESHOLD_MAX) / 2).toFixed(3)}</span>
              <span>{THRESHOLD_MAX.toFixed(3)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Lulus ≥" value={t.lulus} disabled={locked} onCommit={(n) => ed.patch({ lulus: n })} />
            <NumField label="Tidak lulus <" value={t.tidakLulus} disabled={locked} onCommit={(n) => ed.patch({ tidakLulus: n })} />
            <NumField label="Toleransi awal" value={t.batasAwal} disabled={locked} onCommit={(n) => ed.patch({ batasAwal: n })} />
            <NumField label="Toleransi akhir" value={t.batasAkhir} disabled={locked} onCommit={(n) => ed.patch({ batasAkhir: n })} />
          </div>

          <ThresholdLegend t={t} />

          <div className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <Icon name="info" className="w-3.5 h-3.5 mt-px shrink-0" />
            <span>
              Slider menggeser threshold <b>lulus</b> · garis &amp; warna chart kedalaman
              ikut update realtime. Berlaku ke semua chart QC.
            </span>
          </div>

          {!locked && (
            <div className="flex items-center gap-2 pt-1">
              <button
                className="btn btn-primary"
                disabled={!ed.dirty || ed.isSaving}
                onClick={ed.save}
              >
                <Icon name={ed.isSaving ? 'refresh-cw' : 'save'} className={`h-4 w-4 ${ed.isSaving ? 'animate-spin' : ''}`} />
                {ed.isSaving ? 'Menyimpan…' : 'Simpan threshold'}
              </button>
              {ed.dirty && (
                <button className="btn btn-ghost" disabled={ed.isSaving} onClick={ed.reset}>
                  Batalkan
                </button>
              )}
              {ed.dirty && (
                <span className="text-[11px] font-medium text-amber-600 ml-auto inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Belum disimpan
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kanan: preview chart live re-color */}
        <ThresholdPreviewChart t={t} />
      </div>
    </SectionCard>
  );
}

/** Chart sample yang re-color realtime mengikuti threshold draft. */
function ThresholdPreviewChart({ t }: { t: Threshold }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Preview chart kedalaman
        </span>
        <span className="text-[10px] font-mono text-slate-400">data contoh · 12 STA</span>
      </div>
      <div className="rounded-lg bg-white border border-slate-200 p-2">
        <DepthChart segment={SAMPLE_SEGMENT} points={SAMPLE_POINTS} threshold={t} height={240} />
      </div>
    </div>
  );
}
