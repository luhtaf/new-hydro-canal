# ARCHITECTURE — new-hydro-canal

> Cara kode disusun. Acuan keputusan: [`docs/superpowers/specs/2026-06-15-foundation-architecture-design.md`](./docs/superpowers/specs/2026-06-15-foundation-architecture-design.md).
> Domain rules: [`DOMAIN.md`](./DOMAIN.md). Schema BE: [`PLAN-BE.md`](./PLAN-BE.md). Detail FE: [`PLAN-FE.md`](./PLAN-FE.md).

## Monorepo (npm workspaces)

```
new-hydro-canal/
├── package.json          # workspaces: ["client", "server"]
├── .env.example          # MONGO_URI, SESSION_SECRET, PORT, CLIENT_ORIGIN
├── client/               # Vite + React 18 + TS + Tailwind + PouchDB + Chart.js + Leaflet
├── server/               # Express 4 + TS + Mongoose 7 + session + zod + pino
└── docs/                 # spec + template feature CLAUDE.md
```

Perintah root: `npm run dev` · `npm run build` · `npm run typecheck` · `npm run test`
(masing-masing fan-out ke kedua workspace).

## Vertical slice (package-by-feature)

Kode diorganisir **per fitur**, bukan per layer. Satu fitur = satu folder yang berisi
controller + model(owned) + service + sub-fitur (BE), atau components + hooks (FE).

```
server/src/
├── shared/               # cross-cutting — BUKAN fitur
│   ├── types.ts          # KONTRAK BERSAMA (entity, sync, signature domain helper)
│   ├── config/env.ts     # typed env (zod)
│   ├── db/connect.ts     # mongoose connect + retry
│   ├── middleware/       # logger (pino), error, auth (stub)
│   ├── models/index.ts   # barrel model shared (kosong sampai ada model shared)
│   └── domain/           # finalDepth, deadline, threshold, shortName, splitCanal, fileName, utm (STUB)
├── features/
│   ├── index.ts          # mountFeatures(app) — barel; slice nambah app.use(...)
│   └── <fitur>/          # CLAUDE.md + *.controller/service/routes.ts (+ sub-fitur)
└── jobs/INDEX.md         # registry cron

client/src/
├── shared/               # ui, layout, domain, db (PouchDB), api, stores (zustand), hooks, styles, types.ts
├── features/             # slice FE (components + hooks per fitur)
├── App.tsx               # providers (react-query + router)
├── router.tsx            # createBrowserRouter — slice nambah lazy route
└── main.tsx
```

### Kenapa vertical slice
- Fan-out paralel aman: tiap agent garap 1 folder fitur tanpa tabrakan.
- Blast-radius jelas: ubah fitur X jarang nyenggol fitur Y.
- `shared/` jadi kontrak stabil yang semua slice import.

## Kontrak bersama

`shared/types.ts` (identik di client & server) = sumber kebenaran shape data:
entity (`User`, `Aoi`, `Canal`, `District`, `Pengukuran`, `Contractor`, `AuditLog`,
`Notification`, `Data`), enum (`CanalStatus`, `Role`, `RequestType`), tipe sync
(`SyncDoc`, `OutboxOp`, `ConflictItem`, `PushResult`, `PullResponse`), dan signature
domain helper (`DepthParams`, `Threshold`, `DeadlineInfo`, `FileNameParams`, ...).

Domain helper di `shared/domain/` = STUB (`throw 'not implemented'`); slice shared-domain
yang implement. **Final depth formula WAJIB sinkron** antara `client` & `server` domain.

## Guardrail arsitektur (GLOBAL — wajib semua agent)

Berlaku di SELURUH repo. Per-feature CLAUDE.md boleh **menambah** guardrail lokal,
**tidak boleh override/ignore** yang global (**prinsip global > local**).

1. **`shared/` bukan junk-drawer.** Masuk `shared/` HANYA kalau dipakai ≥2 fitur DAN tak
   ada owner jelas. Ada owner → taruh di fitur owner, fitur lain import.
2. **Doc tidak boleh basi.** Kode = source of truth; CLAUDE.md = pointer. Cross-link via
   frontmatter greppable, bukan prosa. Ubah keterkaitan → update frontmatter di PR yang sama.
3. **Earn the folder, earn the CLAUDE.md.** Jangan bikin subfolder/CLAUDE.md seremonial.
   CLAUDE.md kosong/boilerplate = noise > signal = dilarang.

Tiap folder fitur WAJIB punya CLAUDE.md sesuai [`docs/_feature-claude-template.md`](./docs/_feature-claude-template.md).

## Sync (ringkas — detail di spec § D + PLAN-BE)

UI **hanya** baca/tulis PouchDB (bahkan online). Sync engine terpisah memindahkan
PouchDB ⇄ server (custom REST `/sync/push` + `/sync/pull`, bukan CouchDB replicate).
Doc kecil flat offline → server proyeksikan ke schema `Data` nested. Outbox + retry/backoff;
konflik → UI `/konflik`.

## Auth (ringkas — detail di spec § C)

Session cookie saat online (box always-on). Login pertama wajib online (`/sync/seed`).
Multi-akun per device, switch offline OK kalau sudah pernah login. App-lock PIN default ON.
Identitas utama = `email`; `idpSubject` disisakan untuk bolt-on SSO nanti.
