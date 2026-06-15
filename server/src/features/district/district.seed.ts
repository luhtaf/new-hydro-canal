/**
 * Seeding default districts — PORT `addAllDefaultDistricts` dari app lama.
 *
 * Dipanggil sekali saat koneksi Mongo open (lihat district.routes.ts -> registerDistrictSeed,
 * di-wire di server/src/index.ts setelah connectDb). Idempotent: upsert per districtName,
 * jadi aman dipanggil tiap boot tanpa duplikat.
 *
 * Format seed legacy = `name|code` (DOMAIN.md poin 7 "Output file naming" — kode 4-char).
 * Daftar awal turunan dari sample data WM + pola kode existing. Admin bisa CRUD lewat API.
 */
import { District } from '../../shared/models/District.js';

/**
 * Default districts (`name|code`). Region diisi di luar seed (admin set lewat PUT)
 * karena 1 distrik bisa pindah region; seed cuma jamin name+code dasar ada.
 */
export const DEFAULT_DISTRICTS: ReadonlyArray<string> = [
  'D.SUNGAI_BEYUKU|3C01',
  'D.SUNGAI_PENYABUNGAN|3C02',
  'D.SUNGAI_MENANG|3C03',
  'D.SUNGAI_LUMPUR|3C04',
  'D.SUNGAI_JERUJU|3C05',
];

/** Parse 1 baris "name|code" → objek, atau null kalau malformed. (exported untuk test) */
export function parseLine(line: string): { districtName: string; districtId: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const idx = trimmed.indexOf('|');
  if (idx < 0) return null;
  const districtName = trimmed.slice(0, idx).trim();
  const districtId = trimmed.slice(idx + 1).trim();
  if (!districtName || !districtId) return null;
  return { districtName, districtId };
}

/**
 * Upsert semua default district. Idempotent — match by districtName, set districtId.
 * Field baru (regionName/contractorId) TIDAK ditimpa kalau dokumen sudah ada
 * (pakai $setOnInsert untuk default null) supaya edit admin tidak ke-reset.
 */
export async function addAllDefaultDistricts(
  source: ReadonlyArray<string> = DEFAULT_DISTRICTS,
): Promise<{ seeded: number }> {
  const parsed = source.map(parseLine).filter((x): x is NonNullable<typeof x> => x !== null);

  let seeded = 0;
  for (const { districtName, districtId } of parsed) {
    await District.updateOne(
      { districtName },
      {
        $set: { districtId },
        $setOnInsert: { regionName: null, contractorId: null },
      },
      { upsert: true },
    );
    seeded += 1;
  }

  // Lazy import logger: hindari init pino transport (pino-pretty) saat file ini
  // di-import dari unit test pure (parseLine/DEFAULT_DISTRICTS).
  const { logger } = await import('../../shared/middleware/logger.js');
  logger.info({ seeded }, 'Default districts ter-seed');
  return { seeded };
}
