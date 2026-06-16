---
feature: fe-sync
owns: ["PouchDB:hydrocanal-<userId>", "outbox", "sync-meta"]
uses_models: ["SyncDoc", "OutboxOp", "ConflictItem", "PushResult", "PullResponse"]
touches_features: ["konflik", "auth", "lapangan", "qc", "penugasan"]
jobs: []
---

# Fitur: FE Sync (local-first engine + PouchDB)

## Apa ini
Mesin sinkronisasi local-first untuk client. **SATU JALUR TULIS** (spec § D): UI
hanya baca/tulis ke PouchDB lewat sini; engine memindahkan PouchDB ⇄ server di
belakang layar (push debounce, pull polling, outbox retry). Online/offline invisible
buat logika app. Ini cross-cutting (dipakai semua fitur yang nyimpan data offline)
→ tinggal di `shared/`, bukan di satu fitur.

## Isi folder
- `pouch.ts` — instance PouchDB **per akun** (`hydrocanal-<userId>`) + index
  pouchdb-find (`type`, `type+updatedAt`); akses doc/meta; destroy untuk re-seed.
- `sync.ts` — engine: `writeDoc`/`deleteDoc` (jalur tulis), outbox durable,
  `push` (debounce 5dtk / batch 50 / backoff), `pull` (30dtk + tab-focus),
  `applyResolution`, `syncNow`, `subscribeOutbox` (untuk drawer).
- `conflict.ts` — deteksi (`extractConflicts`) + resolusi (`resolveSingle`/
  `resolveMulti`/`autoResolve`/`diffFields`) + store konflik in-memory + pub/sub.
- `seed.ts` — `seed()` initial dari `/sync/seed`; `reseed()` (destroy + seed).
- `usePouchDoc.ts` — hook subscribe 1 doc live untuk akun aktif (jalur baca).
- `*.test.ts` — unit test logika konflik (murni, tanpa PouchDB).

## Keterkaitan
- Ubah jalur tulis `writeDoc` → efek ke SEMUA penulis offline: [lapangan]
  (parameter/kedalaman), [qc], [penugasan]. Mereka WAJIB tulis lewat `writeDoc`,
  jangan `getPouch().put` langsung (kalau bypass → tidak masuk outbox → data hilang).
- Konflik dari `push` ditolak → di-`add` ke store konflik → [konflik] page render.
- `refreshPendingBadge` panggil `auth.setSyncState(userId, {pending})` → efek ke
  [auth] SyncBadge per-akun.
- Endpoint server: `/sync/push`, `/sync/pull`, `/sync/seed`, `/sync/ping`
  (slice BE `be-sync`). Kalau shape `SyncDoc`/`PushResult`/`PullResponse` berubah →
  update `shared/types.ts` (FE+BE) di PR yang sama.
- `useOnlineSync({ verifyWithPing:true })` (shared/hooks/useOnline.ts) pakai
  `/sync/ping`; engine `push`/`pull` cek `ui.online` sebelum jalan.

## Jobs/Cron
—

## Aturan domain
- DOMAIN.md poin 4 (final depth) dipakai conflict preview lewat
  `shared/domain/depth.ts` — JANGAN duplikat formula di sini.
- Strategi resolusi (spec § D): parameter=LWW, depth=manual, canal/meta=server-wins.
