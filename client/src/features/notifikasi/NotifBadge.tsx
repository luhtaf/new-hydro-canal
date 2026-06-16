/**
 * NotifBadge — komponen "headless" yang menyiarkan jumlah unread ke chrome global:
 *   1. `document.title` → "(N) HydroCanal QC — Operations" (demo `updateTitleBadge`).
 *   2. Badge counter di nav-link sidebar "Notifikasi" (demo `#notif-nav-badge`).
 *
 * Kenapa DOM injection untuk badge sidebar: file shell bersama (Sidebar.tsx / nav-config.ts)
 * di luar slice ini dan TIDAK boleh disentuh. Sidebar me-render `<NavLink to="/notifikasi">`
 * → kita cari anchor `a[href="/notifikasi"]` lalu sisipkan/segarkan satu <span> badge.
 * Idempoten (badge ditandai data-attr; tak menumpuk) & dibersihkan saat unmount.
 *
 * Tidak merender markup sendiri (return null). Dipasang sekali oleh NotifInbox; karena
 * inbox di-prefetch + refetchInterval, badge tetap segar walau halaman lain dibuka.
 * Saat slice [layout] kelak menyediakan slot badge data-driven, ganti efek ini dengan
 * konsumsi `useUnreadCount` di Sidebar dan hapus DOM injection di sini.
 */
import { useEffect } from 'react';
import { useUnreadCount } from './hooks.js';

const DOC_TITLE = 'HydroCanal QC — Operations';
const BADGE_ATTR = 'data-notif-badge';

function syncTitle(unread: number): void {
  document.title = (unread > 0 ? `(${unread}) ` : '') + DOC_TITLE;
}

function syncSidebarBadge(unread: number): void {
  // Anchor nav sidebar (desktop + drawer mobile bisa dua-duanya saat drawer terbuka).
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href="/notifikasi"]',
  );
  links.forEach((link) => {
    let badge = link.querySelector<HTMLSpanElement>(`span[${BADGE_ATTR}]`);
    if (unread <= 0) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.setAttribute(BADGE_ATTR, '');
      // Kelas selaras badge konflik di nav-config (rose pill kecil).
      badge.className =
        'ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold';
      link.appendChild(badge);
    }
    badge.textContent = String(unread);
  });
}

export function NotifBadge(): null {
  const unread = useUnreadCount();

  useEffect(() => {
    syncTitle(unread);
    syncSidebarBadge(unread);
  }, [unread]);

  // Bersihkan badge + judul saat slice di-unmount (mis. logout / route teardown).
  useEffect(() => {
    return () => {
      document.title = DOC_TITLE;
      document
        .querySelectorAll(`span[${BADGE_ATTR}]`)
        .forEach((el) => el.remove());
    };
  }, []);

  return null;
}

export default NotifBadge;
