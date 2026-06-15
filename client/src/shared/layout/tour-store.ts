/**
 * tour-store — state walkthrough 8-step + langkah-langkahnya.
 *
 * Demo ref: app.js TOUR_STEPS + startTour/endTour/showTourStep. Auto-trigger saat
 * kunjungan pertama (flag `tourSeen` di localStorage). Tiap step bisa punya `go`
 * (route) supaya tour pindah halaman; spotlight menyorot elemen `sel`.
 */
import { create } from 'zustand';

export interface TourStep {
  /** CSS selector elemen yang disorot. */
  sel: string;
  title: string;
  body: string;
  /** route yang harus aktif untuk step ini (opsional). */
  go?: string;
}

const TOUR_SEEN_KEY = 'tourSeen';

/** 8 langkah — teks & target persis demo. */
export const TOUR_STEPS: TourStep[] = [
  { sel: '#topnav a[href="/"]', title: 'Dashboard', body: 'Mulai dari sini. Stat overview, penugasan minggu ini, dan status QC terbaru.', go: '/' },
  { sel: '#topnav button[title="Cari (⌘K)"]', title: 'Command palette ⌘K', body: 'Tekan ⌘K (atau Ctrl+K) buat jump cepat antar halaman dan jalanin perintah.' },
  { sel: '#role-switcher', title: 'Role hierarchy', body: 'Klik untuk ganti Admin ↔ Operator. Nav links & permission akan menyesuaikan otomatis.' },
  { sel: 'a[href="/penugasan"]', title: 'Penugasan saya', body: 'Operator lihat assignment-nya di sini. Klik kartu untuk masuk ke detail + lokasi peta.', go: '/penugasan' },
  { sel: 'a[href="/lapangan/kedalaman"]', title: 'Drag chart kedalaman', body: 'Di form input kedalaman, seret bar chart untuk koreksi titik — masuk antrian sync.', go: '/lapangan/kedalaman' },
  { sel: '#topnav button[title="Toggle koneksi (simulator)"]', title: 'Offline simulator', body: 'Klik untuk simulasi sinyal hilang. Form tetap jalan, perubahan masuk antrian.' },
  { sel: '#topnav button[title="Antrian sinkronisasi"]', title: 'Antrian sync', body: 'Semua perubahan offline ada di sini. Akan otomatis terkirim saat online.' },
  { sel: 'a[href="/peta"]', title: 'Peta penugasan', body: 'Map view dengan pin per kanal & sample STA color-coded sesuai threshold.', go: '/peta' },
];

interface TourStore {
  active: boolean;
  index: number;
  start: () => void;
  end: () => void;
  next: () => void;
  prev: () => void;
}

export const useTour = create<TourStore>((set, get) => ({
  active: false,
  index: 0,
  start: () => {
    window.localStorage.setItem(TOUR_SEEN_KEY, 'true');
    set({ active: true, index: 0 });
  },
  end: () => set({ active: false }),
  next: () => {
    const { index } = get();
    if (index >= TOUR_STEPS.length - 1) {
      set({ active: false });
    } else {
      set({ index: index + 1 });
    }
  },
  prev: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
}));

/** Helper imperatif (dipakai TopNav & command palette). */
export const startTour = () => useTour.getState().start();

/** Apakah tour belum pernah ditonton (untuk auto-trigger first visit). */
export function tourNeverSeen(): boolean {
  return window.localStorage.getItem(TOUR_SEEN_KEY) !== 'true';
}
