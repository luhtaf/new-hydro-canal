/**
 * Unit test slice data — bagian MURNI (tanpa DB & tanpa domain stub):
 *  - builder path update (polymorphic positional `$` + arrayFilters)
 *  - tmp dir helper (port ClearTemp): clear idempotent + ensure
 *
 * Catatan: test integrasi penuh (resolveId / CRUD nested / reverse-drag round-trip
 * lewat Mongo) butuh `mongodb-memory-server` (lihat missingDeps) — di-cover di
 * test integrasi terpisah saat dep tsb tersedia.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  segmentSet,
  pointSet,
  pointFiltersById,
  pointFiltersBySta,
} from './updatePaths.js';
import { tmpDir, ensureTmpDir, clearTmpDir } from './export/tmp.js';

describe('updatePaths — polymorphic :id path builders', () => {
  it('segmentSet memprefiks tiap field dgn positional `$`', () => {
    expect(segmentSet({ water_level: '0.5', revision: '001' })).toEqual({
      'canal_data.$.water_level': '0.5',
      'canal_data.$.revision': '001',
    });
  });

  it('segmentSet kosong → objek kosong (tidak menulis apa-apa)', () => {
    expect(segmentSet({})).toEqual({});
  });

  it('pointSet memakai arrayFilters placeholder [seg][pt]', () => {
    expect(pointSet({ depth: 2.84 })).toEqual({
      'canal_data.$[seg].data.$[pt].depth': 2.84,
    });
  });

  it('pointFiltersById target titik by data._id di kedua level', () => {
    expect(pointFiltersById('abc')).toEqual([
      { 'seg.data._id': 'abc' },
      { 'pt._id': 'abc' },
    ]);
  });

  it('pointFiltersBySta target titik by sta dalam segmen tertentu', () => {
    expect(pointFiltersBySta('seg1', 520)).toEqual([
      { 'seg._id': 'seg1' },
      { 'pt.sta': 520 },
    ]);
  });
});

describe('export/tmp — port ClearTemp', () => {
  const created: string[] = [];

  afterEach(async () => {
    delete process.env.CHART_TMP_DIR;
    await Promise.all(created.map((d) => rm(d, { recursive: true, force: true })));
    created.length = 0;
  });

  it('tmpDir hormati env CHART_TMP_DIR', () => {
    process.env.CHART_TMP_DIR = '/custom/tmp';
    expect(tmpDir()).toBe('/custom/tmp');
  });

  it('clearTmpDir aman saat folder belum ada (0 terhapus)', async () => {
    const base = await mkdtemp(path.join(tmpdir(), 'hc-tmp-'));
    created.push(base);
    process.env.CHART_TMP_DIR = path.join(base, 'belum-ada');
    expect(await clearTmpDir()).toBe(0);
  });

  it('ensureTmpDir bikin folder; clearTmpDir mengosongkan isinya', async () => {
    const base = await mkdtemp(path.join(tmpdir(), 'hc-tmp-'));
    created.push(base);
    const dir = path.join(base, 'tmp');
    process.env.CHART_TMP_DIR = dir;

    await ensureTmpDir();
    await writeFile(path.join(dir, 'a.png'), 'x');
    await writeFile(path.join(dir, 'b.png'), 'y');
    await mkdir(path.join(dir, 'sub'), { recursive: true });
    await writeFile(path.join(dir, 'sub', 'c.zip'), 'z');

    const removed = await clearTmpDir();
    expect(removed).toBe(3); // a.png, b.png, sub/
    expect(await readdir(dir)).toEqual([]);
  });
});
