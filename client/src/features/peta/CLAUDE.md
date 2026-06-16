---
feature: peta
owns: []
uses_models: ["Canal"]
touches_features: ["penugasan", "undangan"]
jobs: []
---

# Fitur: Peta penugasan (FE-only)

## Apa ini
Halaman `/peta`: peta Leaflet full-screen (tiles CARTO Voyager) yang menampilkan
1 pin per kanal AOI (warna by status) + sample STA color-coded threshold di sekitar
kanal aktif. Port dari demo `view-peta` + `renderMap`. FE-only — belum ada endpoint
khusus; data marker sementara dari dataset lokal (`canals.ts`).

## Isi folder
- `PetaPage.tsx` — page (default export, route `/peta`). Leaflet diatur imperatif
  via ref; impor `leaflet/dist/leaflet.css` (CSS base tidak ada di globals.css).
  Filter Semua/Aktif/Selesai, popup detail + link `/penugasan/:canalId`, "Lokasi saya".
- `canals.ts` — `PETA_CANALS` (subset `Canal`, koordinat UTM 48S asli). Diganti
  query nyata saat slice penugasan/undangan tersedia.
- `mapHelpers.ts` — helper murni (testable, tanpa impor Leaflet): `STATUS_PIN`
  (warna pin per status), `matchFilter`/`filterCounts`, `sampleSta` (titik STA
  deterministik seeded).
- `routes.tsx` — `petaRoutes` (lazy `/peta`).
- `index.ts` — barrel publik.

## Keterkaitan
- Konversi UTM→WGS84 lewat `shared/domain/utm.utmToLatLng` (proj4 EPSG:32748).
  Ubah definisi proj di shared/domain → posisi pin geser; sinkron BE (`server/src/shared/domain/utm.ts`).
- Warna STA pakai `shared/domain/threshold.THRESHOLD_HEX` (DOMAIN poin 5). Ubah hex
  threshold → ikut berubah di sini + chart [data]/[qc].
- `shortName` (popup) dari `shared/domain/shortName` (DOMAIN poin 8).
- Pin teardrop pakai kelas `.map-pin` di `shared/styles/globals.css` (port demo/style.css).
- Popup link ke `/penugasan/:canalId` ([penugasan]). Saat dataset diganti query
  nyata, ambil dari sumber yang sama dengan [penugasan]/[undangan].

## Jobs/Cron
—

## Aturan domain
- Koordinat UTM 48S → WGS84 (DOMAIN.md "Koordinat (UTM 48S)") via `shared/domain/utm`.
- Warna STA threshold (DOMAIN.md poin 5) via `shared/domain/threshold`.
- shortName kontraktor (DOMAIN.md poin 8) via `shared/domain/shortName`.
