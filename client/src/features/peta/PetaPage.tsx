/**
 * PetaPage — route `/peta`. Peta penugasan full-screen (Leaflet + CARTO Voyager).
 *
 * Port demo `view-peta` + `renderMap`:
 *  - 1 pin per kanal, warna by status (lihat mapHelpers.STATUS_PIN), custom divIcon
 *    bentuk teardrop (kelas .map-pin di globals.css — port demo/style.css).
 *  - popup info kanal + link "Buka detail" ke /penugasan/:canalId.
 *  - sample STA marker (circleMarker) color-coded threshold di sekitar kanal aktif.
 *  - filter Semua / Aktif / Selesai (segmented toggle) → re-render marker.
 *  - "Lokasi saya" (geolocation) → pan ke posisi user.
 *
 * Koordinat dataset = UTM 48S; di-convert ke WGS84 via shared/domain/utm.utmToLatLng
 * (proj4 EPSG:32748) — jalur konversi nyata, bukan lat/lng hardcode.
 *
 * Leaflet diatur imperatif via ref (di luar React render tree). CSS base Leaflet
 * di-impor di sini (scoped ke slice; tidak ada di globals.css).
 */
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, Layers } from 'lucide-react';
import { utmToLatLng } from '../../shared/domain/utm.js';
import { shortName } from '../../shared/domain/shortName.js';
import { toast } from '../../shared/stores/ui.js';
import { PETA_CANALS, type PetaCanal } from './canals.js';
import {
  STATUS_PIN,
  matchFilter,
  filterCounts,
  sampleSta,
  type PetaFilter,
} from './mapHelpers.js';

const CARTO_VOYAGER =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

/** HTML divIcon teardrop (port .map-pin demo). Warna inline by status. */
function pinIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin" style="background:${color}"><span>${label}</span></div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
}

/** Popup HTML untuk 1 kanal (Inter font, link ke detail penugasan). */
function popupHtml(c: PetaCanal): string {
  const { color, label } = STATUS_PIN[c.status];
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:184px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        <b style="font-size:13px;letter-spacing:-.01em">${c.canalId}</b>
        <span style="font-size:10px;font-weight:700;color:#fff;background:${color};padding:1px 6px;border-radius:99px">${label}</span>
      </div>
      <div style="font-size:12px;color:#475569">${c.district.replace(/_/g, ' ')}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:1px">${shortName(c.contractor)} · order ${c.orderNo}${c.requestType === 'RE-QC' ? ' · RE-QC' : ''}</div>
      <a href="/penugasan/${c.canalId}" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:12px;font-weight:600;color:#0284c7;text-decoration:none">Buka detail →</a>
    </div>`;
}

const FILTERS: { key: PetaFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'selesai', label: 'Selesai' },
];

export default function PetaPage() {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const [filter, setFilter] = useState<PetaFilter>('semua');

  const counts = useMemo(() => filterCounts(PETA_CANALS), []);

  // Init map sekali.
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, { zoomControl: true }).setView(
      [-3.05, 104.9],
      10,
    );
    L.tileLayer(CARTO_VOYAGER, {
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // Leaflet kadang salah ukur saat container baru mount (layout shell).
    const t = setTimeout(() => map.invalidateSize(), 80);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // Render ulang marker tiap filter berubah.
  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;
    overlay.clearLayers();

    const shown = PETA_CANALS.filter((c) => matchFilter(c.status, filter));
    const bounds: L.LatLngTuple[] = [];

    shown.forEach((c) => {
      const { lat, lng } = utmToLatLng(c.coordX, c.coordY);
      const { color } = STATUS_PIN[c.status];
      L.marker([lat, lng], {
        icon: pinIcon(color, c.canalId.slice(-3)),
      })
        .addTo(overlay)
        .bindPopup(popupHtml(c));
      bounds.push([lat, lng]);
    });

    // Sample STA di sekitar 1 kanal yang sedang dikerjakan (In Progress) bila tampil.
    const active =
      shown.find((c) => c.status === 'In Progress') ??
      shown.find((c) => c.status === 'Assigned') ??
      shown[0];
    if (active) {
      const { lat, lng } = utmToLatLng(active.coordX, active.coordY);
      sampleSta(active.canalId).forEach((s) => {
        L.circleMarker([lat + s.offsetLat, lng + s.offsetLng], {
          radius: 5,
          color: 'white',
          weight: 2,
          fillColor: s.color,
          fillOpacity: 0.95,
        })
          .addTo(overlay)
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px"><b>STA ${s.sta}</b> · ${active.canalId}<br/><span style="color:${s.color};font-weight:600;text-transform:capitalize">${s.cls === 'tolerance' ? 'toleransi' : s.cls === 'pass' ? 'lulus' : 'gagal'}</span></div>`,
          );
      });
    }

    if (bounds.length === 1 && bounds[0]) map.setView(bounds[0], 13);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [60, 60] });
  }, [filter]);

  const locateMe = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!('geolocation' in navigator)) {
      toast('Perangkat tidak mendukung geolokasi.', 'err');
      return;
    }
    toast('Mencari lokasi…', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        L.circleMarker(ll, {
          radius: 7,
          color: '#0284c7',
          weight: 3,
          fillColor: '#38bdf8',
          fillOpacity: 0.9,
        })
          .addTo(overlayRef.current!)
          .bindPopup('Lokasi kamu')
          .openPopup();
        map.setView(ll, 13);
      },
      () => toast('Gagal mengambil lokasi — izin ditolak.', 'err'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peta penugasan</h1>
          <p className="text-sm text-slate-600 mt-1">
            Lokasi semua kanal AOI + sample STA color-coded sesuai threshold.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-soft">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition inline-flex items-center gap-1.5 ${
                    on
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[10px] tabular-nums font-bold rounded px-1 ${
                      on ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={locateMe} className="btn btn-ghost">
            <Locate className="w-4 h-4" />
            Lokasi saya
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
        <div ref={mapElRef} style={{ height: 'min(620px, calc(100vh - 240px))' }} />
        <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 text-xs">
            <Legend color={STATUS_PIN.Assigned.color} label="Ditugaskan" />
            <Legend color={STATUS_PIN['In Progress'].color} label="Sedang diukur" />
            <Legend color={STATUS_PIN.Done.color} label="Selesai" />
            <Legend color={STATUS_PIN.Submitted.color} label="Belum ditugaskan" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            CARTO Voyager · UTM 48S → WGS84
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <span
        className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0"
        style={{ background: color }}
      />
      {label}
    </div>
  );
}

// Re-export named untuk konsistensi barrel (default = lazy route component).
export { PetaPage };
