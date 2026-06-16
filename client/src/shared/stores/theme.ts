/**
 * Theme store — dark/light mode (demo touch: toggle di top nav, persist localStorage).
 *
 * Demo ref: app.js `applyTheme` / `toggleTheme`. Dark mode di-drive lewat class
 * `body.dark` (lihat globals.css section DARK MODE + tailwind.config darkMode).
 * Default light mode. Persisted di localStorage key `theme`.
 */
import { create } from 'zustand';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

/** Sinkron class `body.dark` ke DOM (sumber kebenaran visual dark mode). */
function applyToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('dark', theme === 'dark');
}

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: readInitial(),
  toggle: () => get().set(get().theme === 'dark' ? 'light' : 'dark'),
  set: (theme) => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyToDom(theme);
    set({ theme });
  },
}));

/** Panggil sekali saat boot supaya class body sinkron sebelum render pertama. */
export function initTheme() {
  applyToDom(useTheme.getState().theme);
}
