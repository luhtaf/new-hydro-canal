/**
 * @vitest-environment jsdom
 *
 * Tes store auth multi-akun. Fokus aturan spec § C:
 * add/switch akun, switch offline gating (via enrolled), logout eksplisit,
 * role override sesi, indikator sync per-akun.
 *
 * Butuh jsdom: store pakai zustand persist → localStorage (tak ada di env node).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAuthStore,
  selectActiveAccount,
  selectAccounts,
  selectEffectiveRole,
  type Account,
} from './store.js';

function makeAccount(over: Partial<Account> = {}): Account {
  return {
    userId: 'u1',
    name: 'Fathul Akmal',
    email: 'fathul@hydrocanal.id',
    idpSubject: null,
    role: 'operator',
    usv: 'KBN01',
    initials: 'FA',
    enrolled: true,
    revoked: false,
    addedAt: '2026-06-15T00:00:00.000Z',
    sync: { pending: 0, lastSyncedAt: null },
    ...over,
  };
}

beforeEach(() => {
  useAuthStore.setState({ activeUserId: null, accounts: {}, roleOverride: null });
});

describe('upsertAccount', () => {
  it('menambah akun dan menjadikannya aktif', () => {
    useAuthStore.getState().upsertAccount(makeAccount());
    const s = useAuthStore.getState();
    expect(s.activeUserId).toBe('u1');
    expect(selectActiveAccount(s)?.email).toBe('fathul@hydrocanal.id');
  });

  it('akun yang baru di-add jadi aktif (ala Gmail)', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u1' }));
    auth.upsertAccount(makeAccount({ userId: 'u2', name: 'Andi', initials: 'AS' }));
    expect(useAuthStore.getState().activeUserId).toBe('u2');
  });
});

describe('switchAccount', () => {
  it('switch ke akun lain yang ada', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u1' }));
    auth.upsertAccount(makeAccount({ userId: 'u2' }));
    auth.switchAccount('u1');
    expect(useAuthStore.getState().activeUserId).toBe('u1');
  });

  it('mengabaikan switch ke userId yang tidak ada', () => {
    useAuthStore.getState().upsertAccount(makeAccount({ userId: 'u1' }));
    useAuthStore.getState().switchAccount('ghost');
    expect(useAuthStore.getState().activeUserId).toBe('u1');
  });

  it('reset roleOverride saat switch', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u1' }));
    auth.upsertAccount(makeAccount({ userId: 'u2' }));
    auth.setRoleOverride('admin');
    auth.switchAccount('u1');
    expect(useAuthStore.getState().roleOverride).toBeNull();
  });
});

describe('logout eksplisit', () => {
  it('hapus akun aktif dan pindah ke akun tersisa', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u1' }));
    auth.upsertAccount(makeAccount({ userId: 'u2' }));
    auth.logout(); // logout akun aktif (u2)
    const s = useAuthStore.getState();
    expect(s.accounts.u2).toBeUndefined();
    expect(s.activeUserId).toBe('u1');
  });

  it('activeUserId null kalau akun terakhir di-logout', () => {
    useAuthStore.getState().upsertAccount(makeAccount({ userId: 'u1' }));
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().activeUserId).toBeNull();
  });
});

describe('indikator sync + revoke per-akun', () => {
  it('setSyncState meng-update pending tanpa menyentuh akun lain', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u1' }));
    auth.upsertAccount(makeAccount({ userId: 'u2' }));
    auth.setSyncState('u1', { pending: 3, lastSyncedAt: '2026-06-15T01:00:00Z' });
    const s = useAuthStore.getState();
    expect(s.accounts.u1!.sync.pending).toBe(3);
    expect(s.accounts.u2!.sync.pending).toBe(0);
  });

  it('setRevoked menandai akun', () => {
    useAuthStore.getState().upsertAccount(makeAccount({ userId: 'u1' }));
    useAuthStore.getState().setRevoked('u1', true);
    expect(useAuthStore.getState().accounts.u1!.revoked).toBe(true);
  });

  it('markEnrolled menandai akun pernah online', () => {
    useAuthStore.getState().upsertAccount(makeAccount({ userId: 'u1', enrolled: false }));
    useAuthStore.getState().markEnrolled('u1');
    expect(useAuthStore.getState().accounts.u1!.enrolled).toBe(true);
  });
});

describe('role override sesi', () => {
  it('selectEffectiveRole pakai override kalau ada', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u1', role: 'operator' }));
    expect(selectEffectiveRole(useAuthStore.getState())).toBe('operator');
    auth.setRoleOverride('admin');
    expect(selectEffectiveRole(useAuthStore.getState())).toBe('admin');
  });

  it('setRoleOverride diabaikan kalau tidak ada akun aktif', () => {
    useAuthStore.getState().setRoleOverride('admin');
    expect(useAuthStore.getState().roleOverride).toBeNull();
  });
});

describe('selectAccounts', () => {
  it('urut berdasarkan addedAt', () => {
    const auth = useAuthStore.getState();
    auth.upsertAccount(makeAccount({ userId: 'u2', addedAt: '2026-06-15T02:00:00Z' }));
    auth.upsertAccount(makeAccount({ userId: 'u1', addedAt: '2026-06-15T01:00:00Z' }));
    const list = selectAccounts(useAuthStore.getState());
    expect(list.map((a) => a.userId)).toEqual(['u1', 'u2']);
  });
});
