/**
 * KedalamanInput (`/lapangan/kedalaman/:canalId`) — page lapangan offline-first.
 * Port demo `view-lapangan-kedalaman` + `renderDepth`:
 *  - Tabel STA editable (#/STA/Lat/Lng/Depth/Date/Status), re-color via threshold.
 *  - DepthChart (Chart.js bar + dragdata + annotation threshold) — di-reuse dari
 *    slice [data] (jangan duplikat). onDragEnd → rawDepthFromFinal → writeDepth →
 *    PouchDB → re-render live → toast "masuk antrian sync".
 *  - DropZoneCSV (multi-Excel page 3) + GpsCaptureButton (navigator.geolocation).
 *
 * SATU JALUR TULIS: semua mutasi lewat depthDoc.writeDepth() (→ sync engine).
 * Baca offline-first lewat useDepthRows (PouchDB live).
 */
import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { useAuthStore } from '../auth/store.js';
import { DepthChart } from '../data/components/DepthChart.js';
import { useThreshold } from '../data/useThreshold.js';
import type {
  CanalDataSegment,
  DepthPoint,
  ThresholdClass,
} from '../../shared/types.js';
import { useDepthRows } from './useDepthRows.js';
import {
  writeDepth,
  displayedOf,
  rawDepthFromFinal,
  statusOf,
  type DepthPayload,
} from './depthDoc.js';
import { GpsCaptureButton } from './components/GpsCaptureButton.js';
import { DropZoneCSV } from './components/DropZoneCSV.js';

// Parameter default formula per kanal (sumber: parameter page-2; sementara default
// 0 sampai slice parameter mengisi). Semua titik 1 kanal share param yang sama.
const DEFAULT_PARAMS: Omit<DepthPayload, 'canalId' | 'sta' | 'depth' | 'lattitude' | 'longitude' | 'measureDate'> = {
  water_level: 0,
  tranducer: 0,
  bed_float: 0,
  depth_correction: 0,
};

const STATUS_LABEL: Record<ThresholdClass, string> = {
  pass: 'Pass',
  tolerance: 'Tolerance',
  fail: 'Not pass',
};
const STATUS_BADGE: Record<ThresholdClass, string> = {
  pass: 'bg-emerald-50 text-emerald-700',
  tolerance: 'bg-amber-50 text-amber-700',
  fail: 'bg-rose-50 text-rose-700',
};
const STATUS_DOT: Record<ThresholdClass, string> = {
  pass: 'bg-emerald-500',
  tolerance: 'bg-amber-500',
  fail: 'bg-rose-500',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function KedalamanInput() {
  const { canalId = '' } = useParams();
  const userId = useAuthStore((s) => s.activeUserId);
  const { threshold } = useThreshold();
  const { rows, loading } = useDepthRows(canalId);
  // titik terpilih (highlight tabel ↔ chart).
  const [selectedSta, setSelectedSta] = useState<number | null>(null);

  // Segment sintetik untuk DepthChart (param non-depth share per kanal).
  const segment = useMemo<CanalDataSegment>(() => {
    const first = rows[0]?.payload;
    return {
      canal_id: canalId,
      dimensi: { panjang: 0, lebar: 0, tinggi: 0 },
      order_no: '',
      operation_no: '0010',
      start: '',
      end: '',
      measure_point: '',
      water_level: String(first?.water_level ?? DEFAULT_PARAMS.water_level),
      depth_correction: String(first?.depth_correction ?? DEFAULT_PARAMS.depth_correction),
      bed_float: String(first?.bed_float ?? DEFAULT_PARAMS.bed_float),
      revision: '0',
      qc_type: 'QC',
      operator: '',
      qc_date: todayIso(),
      measure_date: todayIso(),
      usv_code: '',
      district: { name: '', code: '' },
      canal_upper_width: 0,
      canal_bottom_width: 0,
      canal_length: 0,
      tranducer: first?.tranducer ?? DEFAULT_PARAMS.tranducer,
      lane: 0,
      content_name: '',
      data: [],
    };
  }, [rows, canalId]);

  // DepthPoint[] untuk chart (urut by STA dari PouchDB).
  const points = useMemo<DepthPoint[]>(
    () =>
      rows.map((r) => ({
        _id: r._id,
        sta: r.payload.sta,
        sta_distance: 0,
        depth: r.payload.depth,
        lattitude: r.payload.lattitude,
        longitude: r.payload.longitude,
        time: r.payload.measureDate,
      })),
    [rows],
  );

  const persistPoint = async (payload: DepthPayload) => {
    if (!userId) {
      toast('Belum login — tidak bisa menyimpan.', 'err');
      return;
    }
    await writeDepth(userId, payload);
    toast('Titik di-update · masuk antrian sync', 'warn');
  };

  // Commit hasil drag chart → reverse formula → writeDepth.
  const onChartCommit = async (point: DepthPoint, rawDepth: number) => {
    const cur = rows.find((r) => r.payload.sta === point.sta)?.payload;
    if (!cur) return;
    await persistPoint({ ...cur, depth: rawDepth });
  };

  // Edit depth dari input tabel (nilai yang diketik = displayed/positif).
  const onEditDepth = async (sta: number, displayedAbs: number) => {
    const cur = rows.find((r) => r.payload.sta === sta)?.payload;
    if (!cur) return;
    const raw = rawDepthFromFinal(-Math.abs(displayedAbs), cur);
    await persistPoint({ ...cur, depth: raw });
  };

  // Tulis koordinat GPS ke titik terpilih (atau titik pertama).
  const onCaptureGps = async (coords: { lat: number; lng: number }) => {
    const target =
      rows.find((r) => r.payload.sta === selectedSta)?.payload ?? rows[0]?.payload;
    if (!target) {
      toast('Belum ada titik STA untuk dilekati koordinat.', 'warn');
      return;
    }
    await persistPoint({ ...target, lattitude: coords.lat, longitude: coords.lng });
  };

  // Import multi-CSV/Excel → tulis tiap titik sebagai depth doc.
  const onImport = async (imported: DepthPoint[]) => {
    if (!userId) {
      toast('Belum login — tidak bisa import.', 'err');
      return;
    }
    for (const p of imported) {
      await writeDepth(userId, {
        canalId,
        sta: p.sta,
        depth: p.depth,
        lattitude: p.lattitude,
        longitude: p.longitude,
        measureDate: p.time || todayIso(),
        ...DEFAULT_PARAMS,
      });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-5">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/penugasan" className="hover:text-slate-900">Penugasan</Link>
        <Icon name="arrow-right" className="h-3 w-3 rotate-0" />
        <span className="font-mono text-slate-700">{canalId}</span>
        <Icon name="arrow-right" className="h-3 w-3" />
        <span className="font-medium text-slate-900">Input Kedalaman</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Data kedalaman — <span className="font-mono">{canalId}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} titik STA · GPS tercatat per titik · offline-first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GpsCaptureButton onCapture={onCaptureGps} />
          <Link to="/qc" className="btn btn-primary">
            Kirim ke QC
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tabel STA */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Tabel STA</h2>
            <Legend />
          </div>
          <div className="max-h-[520px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">STA</th>
                  <th className="px-4 py-2 text-left">Latitude</th>
                  <th className="px-4 py-2 text-left">Longitude</th>
                  <th className="px-4 py-2 text-left">Depth</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      Memuat titik dari penyimpanan lokal…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      Belum ada titik. Import CSV/Excel atau tambah dari parameter.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => {
                  const p = r.payload;
                  const cls = statusOf(p, threshold);
                  const dispAbs = Math.abs(displayedOf(p));
                  const active = p.sta === selectedSta;
                  return (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedSta(p.sta)}
                      className={`cursor-pointer transition-colors ${active ? 'bg-brand-50/70' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-1.5 font-mono text-xs text-slate-400">{i + 1}</td>
                      <td className="px-4 py-1.5 font-mono">{p.sta}</td>
                      <td className="px-4 py-1.5 font-mono text-xs text-slate-600">
                        {p.lattitude.toFixed(5)}
                      </td>
                      <td className="px-4 py-1.5 font-mono text-xs text-slate-600">
                        {p.longitude.toFixed(5)}
                      </td>
                      <td className="px-4 py-1.5">
                        <input
                          type="number"
                          step="0.001"
                          defaultValue={dispAbs.toFixed(3)}
                          className="input input-sm w-24 font-mono"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (Number.isFinite(v) && v.toFixed(3) !== dispAbs.toFixed(3)) {
                              void onEditDepth(p.sta, v);
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-1.5 text-xs text-slate-500">
                        {p.measureDate.slice(0, 10)}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={`badge ${STATUS_BADGE[cls]}`}>
                          <span className={`badge-dot ${STATUS_DOT[cls]}`} />
                          {STATUS_LABEL[cls]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: chart + import */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Preview grafik</h2>
              <span className="badge bg-brand-50 text-brand-700">
                <Icon name="chevrons-up-down" className="h-3 w-3" />
                Drag bar
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Seret bar untuk koreksi kedalaman. Threshold di-render sebagai garis.
            </p>
            {points.length > 0 ? (
              <DepthChart
                segment={segment}
                points={points}
                threshold={threshold}
                draggable
                height={260}
                onCommit={(point, raw) => void onChartCommit(point, raw)}
              />
            ) : (
              <div className="grid h-[260px] place-items-center text-xs text-slate-400">
                Grafik muncul setelah ada titik.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Import titik</h2>
            <DropZoneCSV onParsed={(pts) => void onImport(pts)} />
            <p className="mt-2 text-[11px] text-slate-400">
              Multi-file Excel page 3 didukung. Tiap titik masuk antrian sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />Pass
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-500" />Tolerance
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-rose-500" />Not pass
      </span>
    </div>
  );
}

export default KedalamanInput;
