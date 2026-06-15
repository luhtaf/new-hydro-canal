/**
 * Format waktu relatif Bahasa Indonesia (mengganti string statis "15 menit lalu" demo).
 * Pure & deterministik (terima `now` untuk testabilitas). Dipakai NotifInbox.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = now.getTime() - then;
  const sec = Math.round(diffMs / 1000);

  if (sec < 45) return 'baru saja';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const jam = Math.round(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari === 1) return 'kemarin';
  if (hari < 7) return `${hari} hari lalu`;
  const minggu = Math.round(hari / 7);
  if (minggu < 5) return `${minggu} minggu lalu`;
  const bulan = Math.round(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.round(hari / 365)} tahun lalu`;
}
