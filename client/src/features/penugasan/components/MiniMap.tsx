/**
 * MiniMap — peta Leaflet kecil (280px) untuk detail penugasan. Port mini-map demo
 * (`renderPenugasanDetail`): tile CARTO voyager, divIcon pin brand, popup canal.
 *
 * Koordinat AOI = UTM 48S (DOMAIN.md "Koordinat"); convert ke lat/lng pakai
 * `shared/domain/utm` (proj4) sebelum set view/marker.
 *
 * Leaflet butuh CSS-nya sendiri — di-import di sini (sekali, side-effect). Map di-init di
 * useEffect dgn cleanup `remove()` supaya tidak bocor saat unmount / re-render.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { utmToLatLng } from '../../../shared/domain/utm.js';

interface Props {
  coordX: number;
  coordY: number;
  canalId: string;
  district: string;
  /** tinggi px (default 280, sesuai demo). */
  height?: number;
}

export function MiniMap({ coordX, coordY, canalId, district, height = 280 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { lat, lng } = utmToLatLng(coordX, coordY);
    const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(
      [lat, lng],
      13,
    );
    mapRef.current = map;

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      { subdomains: 'abcd', maxZoom: 19 },
    ).addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div class="map-pin task"><span>${canalId.slice(-3)}</span></div>`,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    });
    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Inter,sans-serif"><b>${canalId}</b><br/>${district}</div>`,
      );

    // Leaflet kadang mis-ukur saat container baru di-layout — paksa recalculation.
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordX, coordY, canalId, district]);

  return <div ref={ref} style={{ height }} className="bg-slate-100" />;
}
