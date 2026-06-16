/**
 * useOnline — sinkronkan navigator.onLine ke ui store + listener event + ping.
 *
 * Demo touch: top nav punya toggle online/offline manual (offline simulator).
 * Di produksi, koneksi nyata berasal dari `navigator.onLine` + event
 * `online`/`offline`. Hook ini mendaftarkan listener supaya banner + badge
 * ikut perubahan jaringan; toggle manual tetap bisa override (state lokal).
 *
 * Ping (spec § D / task fe-sync "navigator.onLine+ping"): `navigator.onLine`
 * cuma tahu interface jaringan UP, BUKAN apakah server kebaca (mis. captive
 * portal / API down). Saat browser bilang online, kita verifikasi dengan HEAD
 * ringan ke /sync/ping; gagal → anggap offline efektif (sync engine menahan).
 */
import { useEffect } from 'react';
import { useUi } from '../stores/ui.js';

const PING_URL = '/sync/ping';
const PING_INTERVAL_MS = 30_000;

/** HEAD ringan ke server; true kalau server membalas OK dalam batas waktu. */
export async function pingServer(timeoutMs = 4_000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(PING_URL, {
      method: 'HEAD',
      credentials: 'include',
      cache: 'no-store',
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Sinkronkan status koneksi ke ui store.
 *
 * @param verifyWithPing  Kalau true, verifikasi via HEAD /sync/ping (butuh backend
 *   sync hidup). DEFAULT false di shell: belum ada server, dan toggle manual
 *   (offline simulator) tidak boleh diklobber ping yang selalu gagal. Slice
 *   fe-sync mengaktifkan ping (`useOnlineSync({ verifyWithPing: true })`) begitu
 *   endpoint tersedia.
 */
export function useOnlineSync({ verifyWithPing = false }: { verifyWithPing?: boolean } = {}) {
  const setOnline = useUi((s) => s.setOnline);
  useEffect(() => {
    let cancelled = false;

    // Event jaringan nyata: offline → langsung offline; online → verifikasi
    // (kalau ping aktif) atau percaya interface UP.
    const verify = async () => {
      const ok = verifyWithPing ? await pingServer() : true;
      if (!cancelled) setOnline(ok);
    };
    const goOnline = () => void verify();
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Selaraskan keadaan awal dari interface (tanpa ngeklobber toggle manual:
    // hanya set offline kalau memang interface DOWN).
    if (typeof navigator !== 'undefined' && !navigator.onLine) setOnline(false);

    // Ping berkala hanya kalau diminta (deteksi captive portal / API down).
    let timer: ReturnType<typeof setInterval> | undefined;
    if (verifyWithPing) {
      void verify();
      timer = setInterval(() => void verify(), PING_INTERVAL_MS);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (timer) clearInterval(timer);
    };
  }, [setOnline, verifyWithPing]);
}

/** Baca status online (read-only) untuk komponen. */
export function useOnline() {
  return useUi((s) => s.online);
}
