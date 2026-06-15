import { describe, it, expect } from 'vitest';
import { utmToLatLng, latLngToUtm } from './utm.js';

// Sample AOI (DOMAIN.md) — UTM 48S: SB180200 X=540840 Y=9674337 → sekitar Sumsel (~-2.9°, ~104.8°).
const X = 540840;
const Y = 9674337;

describe('utmToLatLng (UTM 48S → WGS84)', () => {
  it('konversi ke lat/lng yang masuk akal untuk Sumatera Selatan', () => {
    const { lat, lng } = utmToLatLng(X, Y);
    expect(lat).toBeGreaterThan(-3.5);
    expect(lat).toBeLessThan(-2.5);
    expect(lng).toBeGreaterThan(104);
    expect(lng).toBeLessThan(105.5);
  });
});

describe('latLngToUtm (WGS84 → UTM 48S)', () => {
  it('round-trip UTM → latLng → UTM (presisi sub-meter)', () => {
    const { lat, lng } = utmToLatLng(X, Y);
    const { x, y } = latLngToUtm(lat, lng);
    expect(x).toBeCloseTo(X, 1);
    expect(y).toBeCloseTo(Y, 1);
  });

  it('round-trip latLng → UTM → latLng', () => {
    const lat = -2.95;
    const lng = 104.81;
    const { x, y } = latLngToUtm(lat, lng);
    const back = utmToLatLng(x, y);
    expect(back.lat).toBeCloseTo(lat, 6);
    expect(back.lng).toBeCloseTo(lng, 6);
  });
});
