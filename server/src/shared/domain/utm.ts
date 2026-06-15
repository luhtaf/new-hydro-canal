/**
 * Konversi koordinat UTM zona 48S (EPSG:32748) ⇄ WGS84 (DOMAIN.md "Koordinat").
 * Proj4: +proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs
 *
 * Sinkron persis dgn client/src/shared/domain/utm.ts.
 */
import proj4 from 'proj4';
import type { LatLng } from '../types.js';

/** Definisi UTM zona 48S (Sumatera Selatan). */
const UTM_48S = '+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs';
/** WGS84 lon/lat (proj4 default). */
const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

/** UTM (Easting/Northing) → lat/lng untuk Leaflet. */
export function utmToLatLng(x: number, y: number): LatLng {
  const [lng, lat] = proj4(UTM_48S, WGS84, [x, y]);
  return { lat, lng };
}

/** lat/lng → UTM (untuk export PAT yang keep koordinat UTM). */
export function latLngToUtm(lat: number, lng: number): { x: number; y: number } {
  const [x, y] = proj4(WGS84, UTM_48S, [lng, lat]);
  return { x, y };
}
