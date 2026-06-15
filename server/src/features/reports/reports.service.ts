/**
 * Service [reports] — agregasi Mongo (read-only) di atas koleksi `canals` + `users`.
 *
 * Sumber kebenaran outcome = `Canal`. Canal dianggap "QC selesai" saat
 * `status === 'Done'`. Klasifikasi pass/tolerance/fail (lihat reports.types.ts):
 *   - RE-QC                          → tolerance (perlu ukur ulang)
 *   - Done + qcOutput ada            → pass
 *   - Done + qcOutput null/kosong    → fail (tak menghasilkan file)
 *
 * Window waktu dipakai konsisten = `updatedAt` canal (proxy "kapan selesai QC").
 * Semua fungsi menerima `days` (periode) dan menghitung `from` = now - days.
 *
 * Agregasi sengaja ringan & ber-index ($match status+updatedAt) supaya scale di
 * koleksi besar. Tidak ada $lookup berat selain join operator (kecil).
 */
import type { PipelineStage } from 'mongoose';
import { canalModel, userModel } from './reports.models.js';
import { pct, round1, windows } from './reports.math.js';
import type {
  OperatorStat,
  QualityBreakdown,
  RegionStat,
  ReportKpi,
  TrendGroupBy,
  TrendPoint,
} from './reports.types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (math murni di reports.math.ts; di sini cuma yang butuh tipe Mongo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expression $switch untuk klasifikasi outcome 1 canal Done.
 * Dipakai di beberapa pipeline agar logika klasifikasi cuma 1 tempat.
 */
const OUTCOME_EXPR = {
  $switch: {
    branches: [
      { case: { $eq: ['$requestType', 'RE-QC'] }, then: 'tolerance' },
      {
        case: {
          $and: [{ $ne: ['$qcOutput', null] }, { $ne: ['$qcOutput', ''] }],
        },
        then: 'pass',
      },
    ],
    default: 'fail',
  },
} as const;

/** Stage match: canal Done dalam window [from, now). */
function matchDone(from: Date): PipelineStage.Match {
  return { $match: { status: 'Done', updatedAt: { $gte: from } } };
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI
// ─────────────────────────────────────────────────────────────────────────────

interface RawKpi {
  done: number;
  pass: number;
  reqc: number;
  totalHours: number;
  timed: number;
}

async function rawKpi(from: Date, to?: Date): Promise<RawKpi> {
  const range: Record<string, Date> = { $gte: from };
  if (to) range.$lt = to;
  const [row] = await canalModel().aggregate<RawKpi>([
    { $match: { status: 'Done', updatedAt: range } },
    {
      $addFields: {
        _outcome: OUTCOME_EXPR,
        _hours: {
          $cond: [
            { $and: ['$assignedAt', '$updatedAt'] },
            { $divide: [{ $subtract: ['$updatedAt', '$assignedAt'] }, 3_600_000] },
            null,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        done: { $sum: 1 },
        pass: { $sum: { $cond: [{ $eq: ['$_outcome', 'pass'] }, 1, 0] } },
        reqc: { $sum: { $cond: [{ $eq: ['$requestType', 'RE-QC'] }, 1, 0] } },
        totalHours: { $sum: { $ifNull: ['$_hours', 0] } },
        timed: { $sum: { $cond: [{ $ne: ['$_hours', null] }, 1, 0] } },
      },
    },
  ]);
  return row ?? { done: 0, pass: 0, reqc: 0, totalHours: 0, timed: 0 };
}

export async function getKpi(days: number): Promise<ReportKpi> {
  const { from, prevFrom } = windows(days);
  const [cur, prev] = await Promise.all([rawKpi(from), rawKpi(prevFrom, from)]);

  const curPass = pct(cur.pass, cur.done);
  const prevPass = pct(prev.pass, prev.done);
  const curReqc = pct(cur.reqc, cur.done);
  const prevReqc = pct(prev.reqc, prev.done);

  return {
    totalQc: cur.done,
    totalQcDelta: cur.done - prev.done,
    passRate: curPass,
    passRateDelta: round1(curPass - prevPass),
    reqcRatio: curReqc,
    reqcRatioDelta: round1(curReqc - prevReqc),
    avgHours: cur.timed === 0 ? 0 : round1(cur.totalHours / cur.timed),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend
// ─────────────────────────────────────────────────────────────────────────────

export async function getTrend(days: number, groupBy: TrendGroupBy): Promise<TrendPoint[]> {
  const { from } = windows(days);
  const fmt = groupBy === 'week' ? '%G-%V' : '%Y-%m-%d';

  const rows = await canalModel().aggregate<{
    _id: string;
    date: Date;
    done: number;
    pass: number;
  }>([
    matchDone(from),
    { $addFields: { _outcome: OUTCOME_EXPR } },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: '$updatedAt' } },
        date: { $min: '$updatedAt' },
        done: { $sum: 1 },
        pass: { $sum: { $cond: [{ $eq: ['$_outcome', 'pass'] }, 1, 0] } },
      },
    },
    { $sort: { date: 1 } },
  ]);

  return rows.map((r) => ({
    date: r.date.toISOString(),
    done: r.done,
    pass: r.pass,
    passRate: pct(r.pass, r.done),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Per region
// ─────────────────────────────────────────────────────────────────────────────

export async function getPerRegion(days: number): Promise<RegionStat[]> {
  const { from } = windows(days);
  const rows = await canalModel().aggregate<{
    _id: string;
    done: number;
    pass: number;
  }>([
    matchDone(from),
    { $addFields: { _outcome: OUTCOME_EXPR } },
    {
      $group: {
        // Belum ada field region eksplisit di Canal → pakai contractor sbg proxy
        // region pelaksana (tampilan demo "Per region" = per pelaksana).
        _id: { $ifNull: ['$contractor', '—'] },
        done: { $sum: 1 },
        pass: { $sum: { $cond: [{ $eq: ['$_outcome', 'pass'] }, 1, 0] } },
      },
    },
    { $sort: { done: -1 } },
  ]);

  return rows.map((r) => ({
    region: r._id,
    done: r.done,
    pass: r.pass,
    passRate: pct(r.pass, r.done),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Per operator
// ─────────────────────────────────────────────────────────────────────────────

export async function getPerOperator(days: number): Promise<OperatorStat[]> {
  const { from } = windows(days);
  const rows = await canalModel().aggregate<{
    _id: string;
    done: number;
    pass: number;
    reqc: number;
  }>([
    { $match: { status: 'Done', updatedAt: { $gte: from }, assignedTo: { $ne: null } } },
    { $addFields: { _outcome: OUTCOME_EXPR } },
    {
      $group: {
        _id: '$assignedTo',
        done: { $sum: 1 },
        pass: { $sum: { $cond: [{ $eq: ['$_outcome', 'pass'] }, 1, 0] } },
        reqc: { $sum: { $cond: [{ $eq: ['$requestType', 'RE-QC'] }, 1, 0] } },
      },
    },
    { $sort: { done: -1 } },
  ]);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r._id);
  const users = await userModel()
    .find({ _id: { $in: ids } })
    .select('name initials usv')
    .lean<{ _id: unknown; name: string; initials: string; usv: string | null }[]>()
    .exec();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return rows.map((r) => {
    const u = byId.get(String(r._id));
    return {
      userId: String(r._id),
      name: u?.name ?? 'Operator',
      initials: u?.initials ?? '??',
      usv: u?.usv ?? null,
      kanal: r.done,
      passRate: pct(r.pass, r.done),
      reqcRatio: pct(r.reqc, r.done),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown (donut)
// ─────────────────────────────────────────────────────────────────────────────

export async function getBreakdown(days: number): Promise<QualityBreakdown> {
  const { from } = windows(days);
  const [row] = await canalModel().aggregate<QualityBreakdown>([
    matchDone(from),
    { $addFields: { _outcome: OUTCOME_EXPR } },
    {
      $group: {
        _id: null,
        pass: { $sum: { $cond: [{ $eq: ['$_outcome', 'pass'] }, 1, 0] } },
        tolerance: { $sum: { $cond: [{ $eq: ['$_outcome', 'tolerance'] }, 1, 0] } },
        fail: { $sum: { $cond: [{ $eq: ['$_outcome', 'fail'] }, 1, 0] } },
      },
    },
    { $project: { _id: 0, pass: 1, tolerance: 1, fail: 1 } },
  ]);
  return row ?? { pass: 0, tolerance: 0, fail: 0 };
}
