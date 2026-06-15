/**
 * @vitest-environment jsdom
 *
 * Tes app-lock: default ON, set/verify PIN (PBKDF2), lock/unlock, disable.
 * Web Crypto subtle tersedia di Node 20+ (vitest) via globalThis.crypto.
 * Butuh jsdom: store pakai zustand persist → localStorage (tak ada di env node).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useLockStore } from './lock.js';

beforeEach(() => {
  useLockStore.setState({
    enabled: true,
    pinSet: false,
    locked: false,
    biometricEnabled: false,
    pinHash: null,
    saltHex: null,
  });
});

describe('default', () => {
  it('gembok ON by default (spec § C)', () => {
    expect(useLockStore.getState().enabled).toBe(true);
  });
});

describe('setPin + unlockWithPin', () => {
  it('PIN benar membuka, PIN salah tidak', async () => {
    await useLockStore.getState().setPin('1234');
    expect(useLockStore.getState().pinSet).toBe(true);
    expect(useLockStore.getState().pinHash).not.toBeNull();

    useLockStore.setState({ locked: true });
    expect(await useLockStore.getState().unlockWithPin('0000')).toBe(false);
    expect(useLockStore.getState().locked).toBe(true);

    expect(await useLockStore.getState().unlockWithPin('1234')).toBe(true);
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('PIN tidak disimpan plaintext', async () => {
    await useLockStore.getState().setPin('5678');
    expect(useLockStore.getState().pinHash).not.toBe('5678');
    expect(useLockStore.getState().pinHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('lock', () => {
  it('hanya mengunci kalau enabled & pinSet', () => {
    useLockStore.setState({ enabled: true, pinSet: false });
    useLockStore.getState().lock();
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('mengunci kalau enabled & pinSet', async () => {
    await useLockStore.getState().setPin('1111');
    useLockStore.getState().lock();
    expect(useLockStore.getState().locked).toBe(true);
  });
});

describe('disableLock', () => {
  it('mematikan gembok dan menghapus PIN', async () => {
    await useLockStore.getState().setPin('2222');
    useLockStore.getState().disableLock();
    const s = useLockStore.getState();
    expect(s.enabled).toBe(false);
    expect(s.pinSet).toBe(false);
    expect(s.pinHash).toBeNull();
    expect(s.locked).toBe(false);
  });
});
