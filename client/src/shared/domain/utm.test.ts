import { describe, it, expect } from 'vitest';
import { utmToLatLng, latLngToUtm } from './utm';

const X = 540840;
const Y = 9674337;

describe('utmToLatLng (UTM 48S → WGS84)', () => {
  it('lat/lng masuk akal untuk Sumatera Selatan', () => {
    const { lat, lng } = utmToLatLng(X, Y);
    expect(lat).toBeGreaterThan(-3.5);
    expect(lat).toBeLessThan(-2.5);
    expect(lng).toBeGreaterThan(104);
    expect(lng).toBeLessThan(105.5);
  });
});

describe('latLngToUtm round-trip', () => {
  it('UTM → latLng → UTM presisi sub-meter', () => {
    const { lat, lng } = utmToLatLng(X, Y);
    const { x, y } = latLngToUtm(lat, lng);
    expect(x).toBeCloseTo(X, 1);
    expect(y).toBeCloseTo(Y, 1);
  });
});
