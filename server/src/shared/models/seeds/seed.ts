/**
 * Seed util SHARED — idempotent, dipanggil saat boot (index.ts) atau dari test.
 *
 * Tiga seed (semua upsert, aman dijalankan berulang):
 *  1. Districts  — dari `districts.txt` (format `name|code`, port pola existing addAllDefaultDistricts).
 *  2. Contractors — dari `contractors.json` (mapping fullName→shortName, DOMAIN.md poin 8).
 *  3. Default admin — 1 akun admin pertama kalau collection users masih kosong.
 *
 * Acuan: PLAN-BE.md "seeds/" + "Seed default admin saat first boot"; DOMAIN.md poin 7 & 8.
 *
 * CATATAN: file ini hanya seed master data shared. Re-seed otomatis di
 * `mongoose.connection.once('open')` dipasang oleh bootstrap (index.ts), bukan di sini.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import bcrypt from 'bcrypt';
import { District } from '../District.js';
import { Contractor } from '../Contractor.js';
import { UserModel } from '../User.js';

const here = dirname(fileURLToPath(import.meta.url));

/** Inisial dari nama (mis. "Admin Operasional" → "AO"). */
function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Seed districts dari `districts.txt`. Format per baris: `NAMA|KODE` (mis.
 * `D.SUNGAI_BEYUKU|3C01`). Baris kosong & komentar `#` di-skip. Upsert by districtName.
 */
export async function seedDistricts(): Promise<{ inserted: number; total: number }> {
  const raw = await readFile(join(here, 'districts.txt'), 'utf8');
  const rows = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  let inserted = 0;
  for (const line of rows) {
    const [name, code] = line.split('|').map((s) => s?.trim());
    if (!name || !code) continue;
    const res = await District.updateOne(
      { districtName: name },
      { $setOnInsert: { districtName: name, districtId: code } },
      { upsert: true },
    );
    if (res.upsertedCount) inserted++;
  }
  return { inserted, total: rows.length };
}

/** Seed contractors dari `contractors.json`. Upsert by fullName. */
export async function seedContractors(): Promise<{ inserted: number; total: number }> {
  const raw = await readFile(join(here, 'contractors.json'), 'utf8');
  const list = JSON.parse(raw) as Array<{ fullName: string; shortName: string }>;

  let inserted = 0;
  for (const c of list) {
    if (!c.fullName || !c.shortName) continue;
    const res = await Contractor.updateOne(
      { fullName: c.fullName },
      { $setOnInsert: { fullName: c.fullName, shortName: c.shortName, isActive: true } },
      { upsert: true },
    );
    if (res.upsertedCount) inserted++;
  }
  return { inserted, total: list.length };
}

export interface DefaultAdminInput {
  name?: string;
  email?: string;
  /** PIN plaintext yang akan di-hash bcrypt (cost 12). */
  pin?: string;
}

/**
 * Seed 1 admin default kalau collection users masih kosong (first boot).
 * Idempotent: kalau sudah ada user mana pun, tidak melakukan apa-apa.
 * Untuk produksi, override via env (jangan pakai default di repo).
 */
export async function seedDefaultAdmin(
  input: DefaultAdminInput = {},
): Promise<{ created: boolean; email: string }> {
  const name = input.name ?? 'Admin Operasional';
  const email = (input.email ?? 'admin@kartabhumi.id').toLowerCase();
  const pin = input.pin ?? '123456';

  const count = await UserModel.estimatedDocumentCount();
  if (count > 0) return { created: false, email };

  const pinHash = await bcrypt.hash(pin, 12);
  await UserModel.create({
    name,
    email,
    pinHash,
    role: 'admin',
    usv: null,
    status: 'aktif',
    initials: initialsFrom(name),
  });
  return { created: true, email };
}

/** Jalankan semua seed master shared sekaligus (urutan: districts → contractors → admin). */
export async function seedAll(adminInput?: DefaultAdminInput): Promise<{
  districts: Awaited<ReturnType<typeof seedDistricts>>;
  contractors: Awaited<ReturnType<typeof seedContractors>>;
  admin: Awaited<ReturnType<typeof seedDefaultAdmin>>;
}> {
  const districts = await seedDistricts();
  const contractors = await seedContractors();
  const admin = await seedDefaultAdmin(adminInput);
  return { districts, contractors, admin };
}
