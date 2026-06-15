/**
 * LoginPage (`/login`) — enroll / add account ONLINE.
 *
 * Visual di-port dari demo template `view-login` (logo droplets, kartu putih,
 * field USV + Operator + PIN, tombol "Masuk").
 *
 * Beda dari demo: login WAJIB online (spec § C — login pertama tak bisa offline).
 * Field identitas utama = **email** (demo cuma "Operator" nama); USV tetap ada
 * sebagai stempel sesi lapangan. Form pakai react-hook-form + zod.
 *
 * Sukses → upsertAccount + redirect ke `from` (atau `/`). Sync seed ditarik oleh
 * slice sync (markEnrolled dipanggil setelah seed sukses, bukan di sini).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Droplets, Loader2 } from 'lucide-react';
import { authApi } from './api.js';
import { useAuthStore } from './store.js';
import { useLockStore } from './lock.js';
import type { UsvCode } from '../../shared/types.js';

const USV_CODES: UsvCode[] = ['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05'];

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  usv: z
    .enum(['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05'])
    .optional()
    .or(z.literal('')),
  pin: z
    .string()
    .min(4, 'PIN minimal 4 digit')
    .max(8, 'PIN maksimal 8 digit')
    .regex(/^\d+$/, 'PIN hanya angka'),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * `addMode` bisa dari prop (kalau router merender langsung) atau dari
 * `location.state.addMode` (AccountSwitcher → "Tambah akun lain").
 */
export function LoginPage({ addMode: addModeProp }: { addMode?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as
    | { from?: string; addMode?: boolean }
    | null;
  const addMode = addModeProp ?? navState?.addMode ?? false;
  const upsertAccount = useAuthStore((s) => s.upsertAccount);
  const enableLock = useLockStore((s) => s.enableLock);
  const lockPinSet = useLockStore((s) => s.pinSet);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', usv: 'KBN01', pin: '' },
  });

  const from = navState?.from ?? '/';

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      const usv = values.usv === '' ? undefined : values.usv;
      const profile = await authApi.login({
        email: values.email,
        pin: values.pin,
        usv,
      });
      upsertAccount({
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        idpSubject: profile.idpSubject ?? null,
        role: profile.role,
        usv: profile.usv,
        initials: profile.initials,
        enrolled: true, // login online sukses = ter-enroll
        revoked: false,
        addedAt: new Date().toISOString(),
        sync: { pending: 0, lastSyncedAt: null },
      });
      // Gembok app ON by default; kalau PIN gembok belum di-set, arahkan ke setup.
      if (!lockPinSet) enableLock();
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        isOffline(err)
          ? 'Login pertama wajib online. Sambungkan ke internet dulu.'
          : 'Email / PIN salah, atau akun di-nonaktifkan.',
      );
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg mb-3">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <div className="text-2xl font-bold tracking-tight">HydroCanal QC</div>
          <div className="text-sm text-slate-500 mt-1">
            {addMode ? 'Tambah akun ke perangkat ini' : 'Operations & QC processing'}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
          noValidate
        >
          <Field label="Email" error={errors.email?.message}>
            <input
              className="input mt-1.5"
              type="email"
              autoComplete="username"
              placeholder="operator@hydrocanal.id"
              {...register('email')}
            />
          </Field>

          <Field label="USV Code" error={errors.usv?.message}>
            <select className="input mt-1.5" {...register('usv')}>
              <option value="">— (admin / tanpa USV)</option>
              {USV_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="PIN" error={errors.pin?.message}>
            <input
              className="input mt-1.5"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="••••"
              {...register('pin')}
            />
          </Field>

          {serverError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full justify-center disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                Menghubungkan… <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                Masuk <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-slate-100">
            Login pertama wajib online · sesudahnya bisa offline
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

/** Heuristik: error jaringan (offline) vs error kredensial. */
function isOffline(err: unknown): boolean {
  if (!navigator.onLine) return true;
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'ERR_NETWORK'
  );
}
