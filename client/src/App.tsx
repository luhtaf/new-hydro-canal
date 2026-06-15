import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.js';
import { AuthProvider } from './features/auth/index.js';

// Provider root. Theme di-init di main.tsx (zustand + class body, tanpa provider).
// Auth = AuthProvider (bootstrap lock + cek revoke). Sync engine di-start oleh
// AuthProvider/hook auth saat akun aktif (lihat slice auth + shared/db/sync).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: true },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
