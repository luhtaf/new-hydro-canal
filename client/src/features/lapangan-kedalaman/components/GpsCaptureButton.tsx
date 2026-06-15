/**
 * GpsCaptureButton — ambil koordinat lewat navigator.geolocation.
 * Port demo `captureGPS()`: toast progress → koordinat + akurasi, lalu callback.
 *
 * Tidak menulis PouchDB sendiri (single-responsibility) — parent yang memutuskan
 * titik mana yang di-update via writeDepth.
 */
import { useState } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import { toast } from '../../../shared/stores/ui.js';

interface Props {
  /** Dipanggil saat fix GPS berhasil. */
  onCapture: (coords: { lat: number; lng: number; accuracy: number }) => void;
  className?: string;
}

export function GpsCaptureButton({ onCapture, className }: Props) {
  const [busy, setBusy] = useState(false);

  const capture = () => {
    if (!('geolocation' in navigator)) {
      toast('Browser tidak mendukung GPS.', 'err');
      return;
    }
    setBusy(true);
    toast('Mengambil koordinat…', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const { latitude, longitude, accuracy } = pos.coords;
        toast(
          `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`,
          'ok',
        );
        onCapture({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => {
        setBusy(false);
        toast('Gagal ambil GPS: ' + err.message, 'err');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <button
      type="button"
      className={`btn btn-ghost ${className ?? ''}`}
      onClick={capture}
      disabled={busy}
    >
      <Icon name="map-pinned" className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
      {busy ? 'Mencari…' : 'Capture GPS'}
    </button>
  );
}
