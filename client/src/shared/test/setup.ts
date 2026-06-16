/**
 * Setup test global (vitest `setupFiles`). Idempotent & aman untuk env `node`
 * maupun `jsdom`.
 *
 * Kenapa ada: store auth (`features/auth/store.ts` + `lock.ts`) pakai zustand
 * `persist` → `createJSONStorage(() => localStorage)`. Di vitest 1.x + jsdom 24,
 * `window.localStorage` ada sebagai objek tapi method `setItem/getItem` tidak
 * ter-ekspos di VM context (known quirk), jadi `storage.setItem is not a function`.
 *
 * Solusi: pasang Storage in-memory minimal kalau localStorage belum fungsional.
 * Tidak mengubah desain store — cuma menyediakan storage yang dipersyaratkan
 * di lingkungan test. Di browser asli, localStorage native dipakai apa adanya.
 */

function makeMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  } as Storage;
}

function ensureStorage(): void {
  const g = globalThis as unknown as { localStorage?: Storage; window?: Window };
  const usable =
    typeof g.localStorage?.setItem === 'function' &&
    typeof g.localStorage?.getItem === 'function';
  if (usable) return;

  const mem = makeMemoryStorage();
  // Pasang di globalThis (akses `localStorage`) + window (akses `window.localStorage`).
  Object.defineProperty(g, 'localStorage', { value: mem, configurable: true, writable: true });
  if (g.window) {
    Object.defineProperty(g.window, 'localStorage', {
      value: mem,
      configurable: true,
      writable: true,
    });
  }
}

ensureStorage();
