/**
 * PORT existing ClearTemp.js — bersihkan folder tmp hasil export chart (PNG/ZIP).
 *
 * Di app lama, /exportallchart menulis PNG ke folder tmp lalu DELETE /cleartmp
 * mengosongkannya. Path tmp = `<server>/tmp` (relatif cwd runtime), bisa di-override
 * via env CHART_TMP_DIR. Aman idempotent: folder belum ada → 0 file dihapus.
 */
import { readdir, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';

export function tmpDir(): string {
  return process.env.CHART_TMP_DIR ?? path.resolve(process.cwd(), 'tmp');
}

/** Pastikan folder tmp ada (dipakai slice qc sebelum tulis PNG). */
export async function ensureTmpDir(): Promise<string> {
  const dir = tmpDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Hapus seluruh isi tmp. Return jumlah entri terhapus. */
export async function clearTmpDir(): Promise<number> {
  const dir = tmpDir();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return 0; // folder belum ada → tidak ada yang dibersihkan
  }
  await Promise.all(
    entries.map((name) => rm(path.join(dir, name), { recursive: true, force: true })),
  );
  return entries.length;
}
