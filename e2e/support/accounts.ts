/**
 * Akun test deterministik untuk E2E.
 *
 * `admin` = seed default first-boot (server seedDefaultAdmin / env SEED_ADMIN_*).
 * `operator` = akun lapangan; di-provision lewat global-setup (POST /auth + admin
 * create user) ATAU sudah ada di Mongo seed. Email/PIN harus cocok dengan data
 * yang di-seed di global-setup.ts.
 *
 * Grain identitas = email (spec § C). USV = stempel sesi lapangan (operator saja).
 */
export interface E2eAccount {
  email: string;
  pin: string;
  /** USV code untuk operator lapangan; admin = '' (tanpa USV). */
  usv: '' | 'KBN01' | 'KBN02' | 'KBN03' | 'KBN04' | 'KBN05';
  role: 'admin' | 'operator';
  /** Nama tampil (untuk assersi greeting dashboard). */
  name: string;
}

export const ACCOUNTS: Record<'admin' | 'operator', E2eAccount> = {
  admin: {
    email: 'admin@kartabhumi.id',
    pin: '123456',
    usv: '',
    role: 'admin',
    name: 'Admin Operasional',
  },
  operator: {
    email: 'operator@kartabhumi.id',
    pin: '654321',
    usv: 'KBN01',
    role: 'operator',
    name: 'Operator Lapangan',
  },
};
