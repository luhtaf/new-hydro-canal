/**
 * content — sumber data statis HelpPage (shortcuts, glossary, FAQ).
 *
 * Dipisah dari komponen supaya:
 *  - greppable & gampang di-extend tanpa nyentuh layout,
 *  - jadi acuan tunggal istilah domain (sinkron DOMAIN.md + demo view-help),
 *  - bisa dipakai ulang (mis. command palette "cari istilah" nanti).
 *
 * Teks = ground-truth demo (demo/index.html view-help). JANGAN ubah formula
 * final depth di sini — cuma deskripsi; angka sebenarnya dari shared/domain.
 */
import type { IconName } from '../../shared/lib/icon.js';

/** Satu baris shortcut keyboard. `keys` dirender sebagai chip <kbd>. */
export interface Shortcut {
  /** deskripsi aksi (bahasa Indonesia casual). */
  action: string;
  /** urutan tombol (mis. ['⌘', 'K']). */
  keys: string[];
}

/**
 * Daftar shortcut. ⌘K/ESC/↑↓↵ benar-benar di-handle shell
 * (useShortcuts + CommandPalette). ⌘P/⌘R didelegasikan ke browser native.
 */
export const SHORTCUTS: Shortcut[] = [
  { action: 'Buka command palette', keys: ['⌘', 'K'] },
  { action: 'Tutup overlay / modal', keys: ['ESC'] },
  { action: 'Navigasi palette', keys: ['↑', '↓'] },
  { action: 'Pilih item palette', keys: ['↵'] },
  { action: 'Cetak halaman aktif', keys: ['⌘', 'P'] },
  { action: 'Refresh data', keys: ['⌘', 'R'] },
];

/** Satu entri glossary: istilah (mono) + penjelasan (boleh ada <b>/<code> via flag). */
export interface GlossaryEntry {
  term: string;
  /** penjelasan. Pakai `mono` untuk render formula monospace. */
  desc: string;
  /** true → desc dirender font-mono (formula final depth). */
  mono?: boolean;
}

/** Glossary lengkap istilah QC kanal (sinkron DOMAIN.md + demo). */
export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'AOI',
    desc: 'Area of Interest — file notifikasi "AOI QC Canal USV Notification" dari WM. 1 baris = 1 Canal ID, tiap canal punya Order No sendiri.',
  },
  {
    term: 'Order No',
    desc: 'Nomor order per Canal ID (mis. 2000349189), bukan per undangan. Satu AOI bisa berisi banyak Order No.',
  },
  {
    term: 'Request Date',
    desc: 'Tanggal AOI masuk. Acuan deadline: maks 5 hari, hari masuk = hari ke-1 (deadline = Request Date + 4 hari).',
  },
  {
    term: 'SPK',
    desc: 'Masa kontrak: Start Date → Finish Date. Acuan batas pengukuran lapangan.',
  },
  {
    term: 'QC Date / Budat',
    desc: 'Tanggal pengolahan data s/d upload (bukan tanggal ukur).',
  },
  {
    term: 'Measure Date',
    desc: 'Tanggal pengukuran. Jika pengukuran asli lewat Finish Date AOI → Measure Date di-clamp = Finish Date.',
  },
  {
    term: 'Measure Point',
    desc: 'Kode titik ukur numerik dari AOI (mis. 382956). Wajib tanpa spasi.',
  },
  {
    term: 'Coordinate UTM',
    desc: 'Koordinat X/Y UTM (zona 48S Sumsel) lokasi canal dari AOI. Dipakai export PAT.',
  },
  {
    term: 'Region / Area / Vendor',
    desc: 'Header AOI: Region (Palembang), Area (SUMSEL P1), Vendor pelaksana (PT. KARTA BHUMI NUSANTARA).',
  },
  {
    term: 'STA',
    desc: 'Stationing — jarak titik ukur dari awal kanal (mis. STA 500 = 500m dari mulut kanal).',
  },
  {
    term: 'water_level',
    desc: 'Tinggi muka air saat pengukuran (m). Komponen penjumlahan final depth.',
  },
  {
    term: 'tranducer',
    desc: 'Offset alat sonar (m) dari permukaan air ke transducer.',
  },
  {
    term: 'bed_float',
    desc: 'Koreksi ketinggian alat ke dasar floating reference.',
  },
  {
    term: 'depth_correction',
    desc: 'Faktor koreksi kalibrasi sonar (dikurangkan dari final).',
  },
  {
    term: 'QC Type',
    desc: 'QC (Q1) atau RE-QC (Q2). Mempengaruhi REV di file TXT dan suffix nama file.',
  },
  {
    term: 'USV',
    desc: 'Unmanned Surface Vehicle — kapal sonar otonom (KBN01, KBN02, dst).',
  },
  {
    term: 'Region',
    desc: 'Kelompok distrik per kontraktor (mis. PT. Ciptamas Bumi Subur memayungi 3C01, 3C02, 3C05).',
  },
  {
    term: 'PAT',
    desc: 'Permintaan Akses Tanah — request lokasi titik QC (export pakai koordinat UTM).',
  },
  {
    term: 'Final depth',
    desc: 'depth + water_level + tranducer + bed_float − depth_correction (lalu di-flip negatif untuk grafik).',
    mono: true,
  },
];

/** Satu item FAQ collapsible. `defaultOpen` → terbuka saat mount. */
export interface FaqItem {
  q: string;
  a: string;
  defaultOpen?: boolean;
}

/** FAQ — pertanyaan operasional umum (demo view-help). */
export const FAQ: FaqItem[] = [
  {
    q: 'Apa beda QC dan RE-QC?',
    a: 'QC adalah pengukuran pertama. RE-QC adalah pengukuran ulang setelah ada koreksi/komplain. RE-QC menambah +1 ke REV di TXT, dan nama file pakai suffix Q2.',
    defaultOpen: true,
  },
  {
    q: 'Kalau panjang kanal > 999m?',
    a: 'Kanal dibagi 2 segmen logis. ID-1 (0–500), ID-2 (500–1200). STA sambungan 500 di ID-2 di-skip (langsung 520) untuk hindari duplikat.',
  },
  {
    q: 'Bagaimana offline mode bekerja?',
    a: 'Semua input form tersimpan ke PouchDB lokal di browser. Saat online, app push perubahan ke server REST API. Konflik (2 device edit sama) ditampilkan di page Konflik untuk resolusi manual.',
  },
  {
    q: 'Apa yang membedakan Admin vs Operator?',
    a: 'Operator hanya bisa input data lapangan, lihat penugasannya, dan QC. Admin bisa buat undangan, manage operator, ubah threshold, akses reports + audit log.',
  },
];

/** Kontak helpdesk (sidebar Quick start). */
export interface ContactLink {
  icon: IconName;
  label: string;
  href: string;
}

export const CONTACTS: ContactLink[] = [
  { icon: 'mail', label: 'support@hydrocanal.id', href: 'mailto:support@hydrocanal.id' },
  { icon: 'message-circle', label: 'WhatsApp helpdesk', href: '#' },
  { icon: 'github', label: 'Report issue', href: '#' },
];
