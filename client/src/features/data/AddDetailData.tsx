/**
 * AddDetailData (`/admin/data/:id/detail/add`) — port `AddDetailData.js`.
 * Tambah 1 titik kedalaman ke segment (:id = segment id). POST /detaildata/:id.
 * Tombol "Capture GPS" mengisi lat/lng dari navigator.geolocation (touch demo).
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { useAddDetail } from './hooks.js';
import type { DepthPoint } from '../../shared/types.js';

interface PointForm {
  sta: string;
  sta_distance: string;
  depth: string;
  lattitude: string;
  longitude: string;
  time: string;
}

const EMPTY: PointForm = {
  sta: '',
  sta_distance: '20',
  depth: '',
  lattitude: '',
  longitude: '',
  time: '',
};

export function AddDetailData() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const add = useAddDetail(id);
  const [v, setV] = useState<PointForm>(EMPTY);

  const set = (k: keyof PointForm, val: string) =>
    setV((s) => ({ ...s, [k]: val }));

  const captureGps = () => {
    if (!('geolocation' in navigator)) {
      toast('GPS tidak tersedia di perangkat ini', 'err');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lattitude', String(pos.coords.latitude));
        set('longitude', String(pos.coords.longitude));
        toast('Lokasi GPS terisi', 'ok');
      },
      () => toast('Izin lokasi ditolak', 'err'),
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sta = parseFloat(v.sta);
    const depth = parseFloat(v.depth);
    if (!Number.isFinite(sta) || !Number.isFinite(depth)) {
      toast('STA & depth wajib numerik', 'err');
      return;
    }
    const point: Partial<DepthPoint> = {
      sta,
      sta_distance: parseFloat(v.sta_distance) || 0,
      depth,
      lattitude: parseFloat(v.lattitude) || 0,
      longitude: parseFloat(v.longitude) || 0,
      time: v.time || new Date().toISOString(),
    };
    add.mutate(point, {
      onSuccess: () => {
        toast('Titik ditambahkan · masuk antrian sync', 'ok');
        nav(`/admin/data/${id}/detail`);
      },
      onError: () => toast('Gagal menambah titik', 'err'),
    });
  };

  const F = ({
    label,
    name,
    type = 'text',
    mono,
  }: {
    label: string;
    name: keyof PointForm;
    type?: string;
    mono?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={v[name]}
        onChange={(e) => set(name, e.target.value)}
        className={`input input-sm ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );

  return (
    <PageShell title="Tambah Titik Kedalaman">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-card p-6 max-w-2xl space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="STA" name="sta" type="number" mono />
          <F label="STA distance" name="sta_distance" type="number" mono />
          <F label="Depth (raw, m)" name="depth" type="number" mono />
          <F label="Waktu (ISO, opsional)" name="time" />
          <F label="Latitude" name="lattitude" mono />
          <F label="Longitude" name="longitude" mono />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ghost" onClick={captureGps}>
            <Icon name="map-pinned" className="h-4 w-4" />
            Capture GPS
          </button>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button type="submit" className="btn btn-primary" disabled={add.isPending}>
            <Icon name="check" className="h-4 w-4" />
            Simpan titik
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => nav(`/admin/data/${id}/detail`)}
          >
            Batal
          </button>
        </div>
      </form>
    </PageShell>
  );
}

export default AddDetailData;
