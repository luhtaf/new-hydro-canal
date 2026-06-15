import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api ke server dev supaya session cookie satu origin saat dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    // Default 'node' — cukup untuk test domain/util murni di scaffold.
    // File yang butuh DOM (mis. auth store/lock pakai localStorage via zustand
    // persist) opt-in lewat docblock `// @vitest-environment jsdom`.
    environment: 'node',
    globals: true,
    // Setup global: pasang localStorage in-memory kalau env-nya belum punya yang
    // fungsional (vitest+jsdom 24 quirk). Idempotent & aman utk file env node.
    setupFiles: ['./src/shared/test/setup.ts'],
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
});
