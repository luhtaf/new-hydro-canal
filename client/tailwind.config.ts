import type { Config } from 'tailwindcss';

/**
 * Design tokens — sumber: DESIGN.md (root).
 * Aesthetic: dashboard premium (Linear/Vercel/Stripe), restrained + 1 accent.
 *
 * CATATAN: token shadow-soft/card/pop dipakai luas di folder fitur tapi sebelumnya
 * belum terdefinisi (silent no-op). Definisi di sini otomatis nyebar ke seluruh app.
 */
const config: Config = {
  darkMode: ['class', 'body.dark'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Accent — brand sky/cyan, ground-truth dari demo (#0284c7 → #0ea5e9).
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        // Heading berkarakter (geometric grotesk teknikal) — load via index.html.
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Body padat-data.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Angka / ID / kode (tabular).
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Skala density-tinggi (DESIGN.md §2). Base 15px (bukan 16) untuk tool kerja.
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12 / 16
        sm: ['0.84375rem', { lineHeight: '1.25rem' }], // 13.5 / 20
        base: ['0.9375rem', { lineHeight: '1.375rem' }], // 15 / 22
        lg: ['1.125rem', { lineHeight: '1.625rem' }], // 18 / 26
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20 / 28
        '2xl': ['1.5rem', { lineHeight: '1.875rem' }], // 24 / 30
        display: ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30 / 36
      },
      letterSpacing: {
        tight: '-0.02em',
      },
      borderRadius: {
        // Default surface = xl (12). Hindari over-rounding.
        DEFAULT: '0.375rem', // 6
        lg: '0.5rem', // 8
        xl: '0.75rem', // 12
        '2xl': '1rem', // 16
      },
      boxShadow: {
        // Subtle berlapis (ambient + key tipis) — bukan default Tailwind "berasap".
        soft: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)',
        card: '0 1px 2px rgb(15 23 42 / 0.05), 0 2px 6px rgb(15 23 42 / 0.06)',
        pop: '0 4px 12px -2px rgb(15 23 42 / 0.10), 0 12px 28px -8px rgb(15 23 42 / 0.14)',
        float: '0 20px 50px -12px rgb(15 23 42 / 0.25)',
        focus: '0 0 0 3px rgb(14 165 233 / 0.35)',
      },
      spacing: {
        // Tambahan step 8pt-rhythm yang rapi untuk shell.
        15: '3.75rem', // 60
        18: '4.5rem', // 72
        sidebar: '15rem', // 240 — lebar sidebar
      },
      transitionTimingFunction: {
        // Easing premium (ease-out-expo-ish) dari DESIGN.md §7.
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
};

export default config;
