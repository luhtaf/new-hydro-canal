/**
 * AkunSection — section Akun (port demo view-pengaturan blok Akun).
 *
 * Menampilkan profil akun aktif (read-only — sumber kebenaran ada di [auth] store,
 * di-edit lewat alur online/admin, bukan di sini), plus toggle preferensi:
 *   - Sinkron otomatis (settingsStore.autoSync) — demo `data-toggle-setting=autoSync`.
 *   - Gembok app (app-lock) ON/OFF — milik [auth] `useLockStore` (spec § C).
 *   - Biometrik — opsional, hanya kalau platform authenticator tersedia.
 *
 * App-lock = "Toggle app-lock dari fitur auth" sesuai tugas slice.
 */
import { useEffect, useState } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import { useAuth, useRole } from '../../auth/hooks.js';
import { useLockStore, biometricAvailable } from '../../auth/lock.js';
import { confirmDialog } from '../../../shared/layout/confirm.js';
import { toast } from '../../../shared/stores/ui.js';
import { useSettingsStore } from '../settingsStore.js';
import { SectionCard } from './SectionCard.js';
import { Toggle } from './Toggle.js';

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <input className={`input mt-1.5 ${mono ? 'font-mono' : ''}`} value={value} readOnly />
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  label,
  disabled,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (n: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}

export function AkunSection() {
  const { account } = useAuth();
  const { role } = useRole();

  const autoSync = useSettingsStore((s) => s.autoSync);
  const setAutoSync = useSettingsStore((s) => s.setAutoSync);

  const lockEnabled = useLockStore((s) => s.enabled);
  const pinSet = useLockStore((s) => s.pinSet);
  const biometricEnabled = useLockStore((s) => s.biometricEnabled);
  const enableLock = useLockStore((s) => s.enableLock);
  const disableLock = useLockStore((s) => s.disableLock);
  const setBiometricEnabled = useLockStore((s) => s.setBiometricEnabled);

  const [bioSupported, setBioSupported] = useState(false);
  useEffect(() => {
    let alive = true;
    void biometricAvailable().then((ok) => alive && setBioSupported(ok));
    return () => {
      alive = false;
    };
  }, []);

  const roleLabel = role === 'admin' ? 'Admin / Manager' : 'QC Operator';

  function handleLockToggle(next: boolean) {
    if (next) {
      enableLock();
      toast('Gembok app dinyalakan — atur PIN saat app dikunci berikutnya', 'ok');
      return;
    }
    // Mematikan gembok = menurunkan proteksi device lapangan (spec § C tradeoff).
    confirmDialog({
      title: 'Matikan gembok app?',
      body: 'Tanpa gembok, siapa pun yang memegang perangkat ini bisa membuka aplikasi tanpa PIN/biometrik. Tetap matikan?',
      confirm: 'Ya, matikan',
      danger: true,
      onConfirm: () => {
        disableLock();
        toast('Gembok app dimatikan', 'warn');
      },
    });
  }

  function handleBiometricToggle(next: boolean) {
    if (next && !bioSupported) {
      toast('Perangkat ini tidak mendukung biometrik', 'warn');
      return;
    }
    setBiometricEnabled(next);
    toast(next ? 'Biometrik diaktifkan' : 'Biometrik dimatikan', 'ok');
  }

  return (
    <SectionCard title="Akun">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama" value={account?.name ?? '—'} />
          <Field label="Role" value={roleLabel} />
          <Field label="USV Code" value={account?.usv ?? '—'} mono />
          <Field label="Email" value={account?.email ?? '—'} />
        </div>

        <ToggleRow
          title="Sinkron otomatis"
          desc="Saat online, kirim antrian setiap 30 detik"
          checked={autoSync}
          onChange={(v) => {
            setAutoSync(v);
            toast('Pengaturan disimpan', 'ok');
          }}
          label="Sinkron otomatis"
        />

        <ToggleRow
          title="Gembok app (PIN / biometrik)"
          desc={
            lockEnabled
              ? pinSet
                ? 'Aktif — app terkunci saat dibuka'
                : 'Aktif — PIN belum diatur'
              : 'Nonaktif — app terbuka tanpa kunci'
          }
          checked={lockEnabled}
          onChange={handleLockToggle}
          label="Gembok app"
        />

        <ToggleRow
          title="Buka dengan biometrik"
          desc={bioSupported ? 'Sidik jari / Face ID sebagai pengganti PIN' : 'Tidak tersedia di perangkat ini'}
          checked={biometricEnabled}
          onChange={handleBiometricToggle}
          label="Biometrik"
          disabled={!lockEnabled}
        />

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <Icon name="shield-check" className="w-3.5 h-3.5 shrink-0" />
          <span>
            Profil diubah lewat admin / saat login online. Gembok app adalah kunci lokal
            perangkat, bukan password akun.
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
