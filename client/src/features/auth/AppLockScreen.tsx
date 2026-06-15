/**
 * AppLockScreen — gembok buka-app (spec § C "App-lock PIN/biometrik ON by default").
 *
 * Dua mode:
 *  - **Set PIN** (gembok ON tapi belum ada PIN): user buat PIN gembok pertama kali.
 *  - **Unlock** (PIN sudah ada): masukkan PIN, atau biometrik kalau diaktifkan.
 *
 * Ini gembok LOKAL device, bukan auth server. Sukses → buka overlay, lanjut ke app.
 * Tidak ada tombol "lupa PIN" lokal: jalan keluar = logout akun (alur online) atau
 * matikan gembok dari settings (butuh PIN dulu). Tradeoff diakui di spec § C.
 */
import { useEffect, useState } from 'react';
import { Droplets, Fingerprint, Lock, Loader2 } from 'lucide-react';
import { useLockStore, biometricAvailable } from './lock.js';

export function AppLockScreen() {
  const pinSet = useLockStore((s) => s.pinSet);
  const biometricEnabled = useLockStore((s) => s.biometricEnabled);
  const setPin = useLockStore((s) => s.setPin);
  const unlockWithPin = useLockStore((s) => s.unlockWithPin);
  const unlockBiometric = useLockStore((s) => s.unlockBiometric);

  const [pin, setPinInput] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);

  useEffect(() => {
    biometricAvailable().then(setCanBiometric);
  }, []);

  const settingMode = !pinSet;

  async function handleSet() {
    setError(null);
    if (!/^\d{4,8}$/.test(pin)) {
      setError('PIN 4–8 digit angka.');
      return;
    }
    if (pin !== confirm) {
      setError('Konfirmasi PIN tidak cocok.');
      return;
    }
    setBusy(true);
    await setPin(pin);
    setBusy(false);
    setPinInput('');
    setConfirm('');
  }

  async function handleUnlock() {
    setError(null);
    setBusy(true);
    const ok = await unlockWithPin(pin);
    setBusy(false);
    if (!ok) {
      setError('PIN salah.');
      setPinInput('');
    }
  }

  async function handleBiometric() {
    setError(null);
    if (
      !window.PublicKeyCredential ||
      typeof navigator.credentials?.get !== 'function'
    ) {
      setError('Biometrik tidak tersedia di perangkat ini.');
      return;
    }
    try {
      // Tantangan ringan untuk user-verification platform authenticator.
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 30_000,
          userVerification: 'required',
        },
      });
      unlockBiometric();
    } catch {
      setError('Verifikasi biometrik gagal. Pakai PIN.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/95 backdrop-blur px-4">
      <div className="w-full max-w-xs text-center">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg mb-3">
          {settingMode ? (
            <Droplets className="w-7 h-7 text-white" />
          ) : (
            <Lock className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="text-xl font-bold tracking-tight text-white">
          {settingMode ? 'Atur PIN perangkat' : 'Aplikasi terkunci'}
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {settingMode
            ? 'Gembok buka-app aktif. Buat PIN untuk perangkat ini.'
            : 'Masukkan PIN untuk membuka aplikasi.'}
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-5 mt-5 space-y-3 text-left">
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder={settingMode ? 'PIN baru (4–8 digit)' : 'PIN'}
            value={pin}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !settingMode) void handleUnlock();
            }}
          />
          {settingMode && (
            <input
              className="input"
              type="password"
              inputMode="numeric"
              placeholder="Konfirmasi PIN"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          {error && <p className="text-[11px] text-rose-600">{error}</p>}

          <button
            type="button"
            disabled={busy}
            onClick={settingMode ? handleSet : handleUnlock}
            className="btn btn-primary w-full justify-center disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : settingMode ? (
              'Simpan PIN'
            ) : (
              'Buka'
            )}
          </button>

          {!settingMode && biometricEnabled && canBiometric && (
            <button
              type="button"
              onClick={handleBiometric}
              className="btn btn-ghost w-full justify-center"
            >
              <Fingerprint className="w-4 h-4" /> Buka dengan biometrik
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
