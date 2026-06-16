/**
 * sync.ts — sync engine local-first (spec § D "Sync — Local-first, custom REST").
 *
 * PRINSIP INTI — SATU JALUR TULIS:
 *   UI HANYA baca/tulis ke PouchDB (lewat `writeDoc`/`deleteDoc` di sini atau
 *   getPouch langsung untuk baca). Engine ini yang memindahkan PouchDB ⇄ server
 *   di belakang layar. Online/offline INVISIBLE untuk logika app.
 *
 * Alur tulis:
 *   writeDoc() → put ke Pouch + enqueue OutboxOp durable → schedule push.
 *   (Kalau offline, op tetap mengantri di Pouch — TIDAK pernah hilang.)
 *
 * Push:  changes → debounce 5 dtk ATAU batch ≥ 50 doc → POST /sync/push.
 *        - sukses    → hapus op dari outbox, set serverBase = rev/updatedAt server.
 *        - konflik   → simpan ConflictItem (conflict.ts), op TETAP di outbox.
 *        - gagal net → retry + backoff (op tetap antri → indikator "⏳").
 *
 * Pull:  GET /sync/pull?since=<seq> tiap 30 dtk + saat tab fokus.
 *        Idempotent: apply changes ke Pouch (server-doc menang utk non-konflik).
 *
 * Engine ini single-instance per akun aktif. start(userId) dipanggil setelah
 * login/switch; stop() saat logout.
 */
import {
  getPouch,
  ensureIndexes,
  getSyncMeta,
  putSyncMeta,
  OUTBOX_PREFIX,
  type OutboxOpDoc,
} from './pouch.js';
import { extractConflicts, addMany } from './conflict.js';
import type { SyncDoc, OutboxOp, PushResult, PullResponse } from '../types.js';
import { useAuthStore } from '../../features/auth/store.js';
import { useUi } from '../stores/ui.js';

// ─────────────────────────────────────────────────────────────────────────────
// Konfigurasi (spec § D)
// ─────────────────────────────────────────────────────────────────────────────

const PUSH_DEBOUNCE_MS = 5_000; // debounce push 5 detik
const PUSH_BATCH_MAX = 50; // ATAU langsung push kalau outbox ≥ 50 op
const PULL_INTERVAL_MS = 30_000; // polling pull 30 detik
const BACKOFF_BASE_MS = 2_000; // backoff awal
const BACKOFF_MAX_MS = 5 * 60_000; // cap 5 menit

const PUSH_URL = '/sync/push';
const PULL_URL = '/sync/pull';

// ─────────────────────────────────────────────────────────────────────────────
// State engine (per proses; satu akun aktif)
// ─────────────────────────────────────────────────────────────────────────────

let activeUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pullTimer: ReturnType<typeof setInterval> | null = null;
let pushing = false; // guard re-entran push
let changesFeed: PouchDB.Core.Changes<Record<string, unknown>> | null = null;
let onFocus: (() => void) | null = null;

function isOnline(): boolean {
  return useUi.getState().online;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Mulai engine untuk akun. Idempotent: start ulang akun sama = no-op. */
export async function start(userId: string): Promise<void> {
  if (activeUserId === userId) return;
  await stop();
  activeUserId = userId;
  await ensureIndexes(userId);

  // Listen perubahan lokal → jadwalkan push (mis. drag chart tulis depth doc).
  changesFeed = getPouch(userId)
    .changes({ since: 'now', live: true })
    .on('change', (c) => {
      // op outbox & meta tidak memicu push lagi (cegah loop).
      if (c.id.startsWith(OUTBOX_PREFIX) || c.id.startsWith('_local/')) return;
      schedulePush();
    });

  // Pull berkala + saat tab fokus.
  pullTimer = setInterval(() => void pull(), PULL_INTERVAL_MS);
  onFocus = () => {
    void pull();
    schedulePush(0);
  };
  window.addEventListener('focus', onFocus);

  await refreshPendingBadge();
  // Kick awal: kirim apa pun yang masih mengantri dari sesi lalu.
  schedulePush(0);
  void pull();
}

/** Hentikan engine (logout / sebelum switch). */
export async function stop(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer), (pushTimer = null);
  if (pullTimer) clearInterval(pullTimer), (pullTimer = null);
  if (changesFeed) changesFeed.cancel(), (changesFeed = null);
  if (onFocus) window.removeEventListener('focus', onFocus), (onFocus = null);
  activeUserId = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// JALUR TULIS (satu-satunya cara UI menulis data domain)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tulis/update SyncDoc. Ini SATU-SATUNYA jalur tulis dari UI.
 * - put ke Pouch (UI langsung lihat via changes/usePouchDoc),
 * - buat OutboxOp durable,
 * - jadwalkan push.
 *
 * @param userId akun aktif. @param doc payload + type; _id wajib.
 */
export async function writeDoc(userId: string, doc: SyncDoc): Promise<void> {
  const db = getPouch(userId);
  const stamped: SyncDoc = { ...doc, updatedAt: new Date().toISOString() };

  // Merge dengan _rev terkini supaya put tidak bentrok lokal.
  try {
    const existing = await db.get(stamped._id);
    stamped._rev = existing._rev;
  } catch {
    /* doc baru */
  }
  await db.put(stamped as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);
  await enqueueOp(userId, stamped);
  await refreshPendingBadge();
  schedulePush();
}

/** Soft-delete (tombstone) → tetap dikirim sebagai _deleted ke server. */
export async function deleteDoc(userId: string, id: string): Promise<void> {
  const db = getPouch(userId);
  let existing: SyncDoc | null = null;
  try {
    existing = (await db.get(id)) as unknown as SyncDoc;
  } catch {
    return; // sudah tidak ada
  }
  const tomb: SyncDoc = { ...existing, _deleted: true, updatedAt: new Date().toISOString() };
  await db.put(tomb as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);
  await enqueueOp(userId, tomb);
  await refreshPendingBadge();
  schedulePush();
}

/** Bungkus SyncDoc jadi OutboxOp durable & simpan di Pouch (idempotent per docId). */
async function enqueueOp(userId: string, doc: SyncDoc): Promise<void> {
  const db = getPouch(userId);
  const opDocId = OUTBOX_PREFIX + doc._id; // 1 op per docId (op terbaru menang)
  const op: OutboxOp = {
    opId: doc._id + '@' + doc.updatedAt,
    docId: doc._id,
    doc,
    attempts: 0,
    nextRetryAt: 0,
    createdAt: new Date().toISOString(),
  };
  let rev: string | undefined;
  try {
    const prev = await db.get(opDocId);
    rev = prev._rev;
  } catch {
    /* op baru */
  }
  await db.put({ ...op, _id: opDocId, _rev: rev } satisfies OutboxOpDoc);
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbox helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Ambil semua op outbox (allDocs prefix range). */
async function listOutbox(userId: string): Promise<OutboxOpDoc[]> {
  const res = await getPouch(userId).allDocs({
    include_docs: true,
    startkey: OUTBOX_PREFIX,
    endkey: OUTBOX_PREFIX + '￿',
  });
  return res.rows
    .map((r) => r.doc as unknown as OutboxOpDoc)
    .filter((d): d is OutboxOpDoc => !!d);
}

/** Hitung op pending → sinkron ke badge UI + auth store per-akun. */
async function refreshPendingBadge(): Promise<void> {
  if (!activeUserId) return;
  const ops = await listOutbox(activeUserId);
  useAuthStore.getState().setSyncState(activeUserId, { pending: ops.length });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH
// ─────────────────────────────────────────────────────────────────────────────

/** Jadwalkan push (debounce). delay=0 → segera (tetap async). */
function schedulePush(delay = PUSH_DEBOUNCE_MS): void {
  if (!activeUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void push(), delay);
  // Batch threshold: kalau outbox sudah ≥ 50, jangan tunggu debounce.
  void listOutbox(activeUserId).then((ops) => {
    if (ops.length >= PUSH_BATCH_MAX) void push();
  });
}

/**
 * Push semua op yang sudah lewat nextRetryAt. Dipanggil debounce / batch /
 * manual ("Sinkron sekarang"). Aman dipanggil saat offline (langsung return).
 */
export async function push(): Promise<void> {
  const userId = activeUserId;
  if (!userId || pushing) return;
  if (!isOnline()) return; // offline → op tetap antri (indikator ⏳)
  pushing = true;
  if (pushTimer) clearTimeout(pushTimer), (pushTimer = null);

  try {
    const now = Date.now();
    const ops = (await listOutbox(userId)).filter((o) => o.nextRetryAt <= now);
    if (ops.length === 0) return;

    const batch = ops.slice(0, PUSH_BATCH_MAX);
    const docs = batch.map((o) => o.doc);

    let results: PushResult[];
    try {
      results = await postPush(docs);
    } catch (err) {
      // Gagal jaringan → backoff SEMUA op di batch, tetap antri.
      await backoffOps(userId, batch, String(err));
      return;
    }

    await applyPushResults(userId, batch, results);
    await refreshPendingBadge();

    // Masih ada sisa? lanjutkan batch berikutnya.
    const remaining = await listOutbox(userId);
    if (remaining.some((o) => o.nextRetryAt <= Date.now())) schedulePush(0);
  } finally {
    pushing = false;
  }
}

/** Terapkan hasil push: sukses→hapus op; konflik→simpan + biarkan op antri. */
async function applyPushResults(
  userId: string,
  batch: OutboxOpDoc[],
  results: PushResult[],
): Promise<void> {
  const db = getPouch(userId);
  const byId = new Map(results.map((r) => [r.id, r]));
  const conflicts = extractConflicts(results);

  for (const op of batch) {
    const r = byId.get(op.docId);
    if (!r) continue; // tidak dibalas → biarkan antri, push lagi nanti
    // Konflik (r.ok === false): op SENGAJA dibiarkan di outbox sampai operator
    // resolve; conflict-nya di-add sekaligus di bawah. Hanya proses yang sukses:
    if (r.ok) {
      // Sukses: hapus op + stempel serverBase di doc data + catat lastSyncedAt.
      await removeOp(db, op);
      await stampServerBase(db, op.docId, op.doc.updatedAt);
      const ts = new Date().toISOString();
      await putSyncMeta(userId, { lastSyncedAt: ts });
      useAuthStore.getState().setSyncState(userId, { lastSyncedAt: ts });
    }
  }
  if (conflicts.length) {
    addMany(conflicts);
    useUi.getState().toast(`${conflicts.length} konflik perlu diselesaikan`, 'warn');
  }
}

/** Hapus op outbox setelah sukses. */
async function removeOp(db: PouchDB.Database, op: OutboxOpDoc): Promise<void> {
  try {
    const cur = await db.get(OUTBOX_PREFIX + op.docId);
    await db.remove(cur);
  } catch {
    /* sudah terhapus */
  }
}

/** Stempel serverBase = updatedAt yang baru ter-ack (untuk conflict detection berikutnya). */
async function stampServerBase(
  db: PouchDB.Database,
  docId: string,
  base: string,
): Promise<void> {
  try {
    const cur = (await db.get(docId)) as unknown as SyncDoc;
    if (cur._deleted) return; // tombstone — biar pull yang bersihkan
    await db.put({ ...cur, serverBase: base });
  } catch {
    /* doc sudah berubah/terhapus */
  }
}

/** Backoff eksponensial untuk batch op yang gagal jaringan. */
async function backoffOps(
  userId: string,
  batch: OutboxOpDoc[],
  err: string,
): Promise<void> {
  const db = getPouch(userId);
  for (const op of batch) {
    try {
      const cur = (await db.get(OUTBOX_PREFIX + op.docId)) as unknown as OutboxOpDoc;
      const attempts = cur.attempts + 1;
      const delay = Math.min(BACKOFF_BASE_MS * 2 ** attempts, BACKOFF_MAX_MS);
      await db.put({ ...cur, attempts, nextRetryAt: Date.now() + delay, lastError: err });
    } catch {
      /* op berubah */
    }
  }
  // Jadwalkan retry setelah backoff terpendek.
  schedulePush(BACKOFF_BASE_MS);
}

/** HTTP POST /sync/push. Idempotent di server (op sama 2x = efek sekali). */
async function postPush(docs: SyncDoc[]): Promise<PushResult[]> {
  const res = await fetch(PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ docs }),
  });
  if (!res.ok) throw new Error(`push HTTP ${res.status}`);
  const json = (await res.json()) as { results: PushResult[] };
  return json.results;
}

// ─────────────────────────────────────────────────────────────────────────────
// PULL
// ─────────────────────────────────────────────────────────────────────────────

/** Tarik perubahan server sejak lastSeq & terapkan ke Pouch. Idempotent. */
export async function pull(): Promise<void> {
  const userId = activeUserId;
  if (!userId || !isOnline()) return;

  const meta = await getSyncMeta(userId);
  let resp: PullResponse;
  try {
    resp = await getPull(meta.lastSeq);
  } catch {
    return; // gagal jaringan → coba lagi interval berikutnya
  }

  const db = getPouch(userId);
  for (const remote of resp.changes) {
    await applyRemote(db, remote);
  }
  await putSyncMeta(userId, { lastSeq: resp.lastSeq });
}

/**
 * Terapkan 1 doc server ke Pouch. Server-doc menang untuk perubahan inbound
 * (sudah lolos di server). serverBase di-set ke updatedAt server supaya edit
 * lokal berikutnya bisa dideteksi konfliknya.
 */
async function applyRemote(db: PouchDB.Database, remote: SyncDoc): Promise<void> {
  let rev: string | undefined;
  try {
    const cur = await db.get(remote._id);
    rev = cur._rev;
  } catch {
    /* doc baru di klien */
  }
  if (remote._deleted) {
    if (rev) {
      try {
        await db.remove({ _id: remote._id, _rev: rev });
      } catch {
        /* race */
      }
    }
    return;
  }
  const next: SyncDoc = { ...remote, serverBase: remote.updatedAt };
  await db.put({
    ...(next as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>),
    _rev: rev,
  });
}

/** HTTP GET /sync/pull?since=. */
async function getPull(since: string | null): Promise<PullResponse> {
  const url = since ? `${PULL_URL}?since=${encodeURIComponent(since)}` : PULL_URL;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`pull HTTP ${res.status}`);
  return (await res.json()) as PullResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolusi konflik → tulis ulang sbg op baru
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Terapkan doc hasil resolusi (dari conflict.ts resolveSingle/resolveMulti):
 * tulis ulang ke Pouch + outbox (push ulang dengan serverBase terbaru), lalu
 * hapus konflik dari daftar.
 */
export async function applyResolution(
  userId: string,
  resolved: SyncDoc,
): Promise<void> {
  await writeDoc(userId, resolved);
}

/** Trigger sync manual ("Sinkron sekarang" di drawer). */
export async function syncNow(): Promise<void> {
  await pull();
  await push();
}

// ─────────────────────────────────────────────────────────────────────────────
// Akses outbox untuk UI (sync drawer + badge)
// ─────────────────────────────────────────────────────────────────────────────

/** Op pending untuk ditampilkan di drawer (read-only). */
export async function listPendingOps(userId: string): Promise<OutboxOpDoc[]> {
  return listOutbox(userId);
}

/** Buang 1 op dari antrian (tombol x di drawer; jarang dipakai — biasanya retry). */
export async function dropOp(userId: string, docId: string): Promise<void> {
  const db = getPouch(userId);
  try {
    const cur = await db.get(OUTBOX_PREFIX + docId);
    await db.remove(cur);
    await refreshPendingBadge();
  } catch {
    /* sudah hilang */
  }
}

/** Subscribe perubahan outbox (live) → callback dengan daftar op terbaru. */
export function subscribeOutbox(
  userId: string,
  cb: (ops: OutboxOpDoc[]) => void,
): () => void {
  const emit = () => void listOutbox(userId).then(cb);
  emit();
  const feed = getPouch(userId)
    .changes({ since: 'now', live: true })
    .on('change', (c) => {
      if (c.id.startsWith(OUTBOX_PREFIX)) emit();
    });
  return () => feed.cancel();
}
