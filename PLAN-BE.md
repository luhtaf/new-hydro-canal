# Backend implementation plan

> Detail implementasi backend: schema, endpoint, sync algorithm, port existing logic. Acuan: `PLAN.md` (master), `DOMAIN.md` (domain rules), `FEEDBACK.md` (sumber requirement).

## Stack backend

```
Node.js 20 LTS
Express 4
Mongoose 7 (MongoDB 6+)
express-session + connect-mongo (session store)
bcrypt (PIN hash)
multer (Excel upload)
xlsx (SheetJS server-side) — parse Excel AOI + generate Excel export
chartjs-node-canvas + Chart.js 4 (port existing) — PNG export
canvas (native, peer dep)
archiver (ZIP bulk export)
dotenv
cors
helmet (security headers, baru)
zod (validasi input)
pino (structured logs, baru — replace console.log existing)
```

## Struktur folder

```
server/
├── index.ts                ← bootstrap: env, mongoose connect, addAllDefaultDistricts, app listen
├── app.ts                  ← Express app: cors, session, routes
├── config/
│   ├── env.ts              ← typed env
│   └── db.ts               ← mongoose connect + retry
├── middleware/
│   ├── auth.ts             ← requireAuth, requireRole('admin')
│   ├── audit.ts            ← log every mutation
│   └── error.ts            ← global error handler
├── models/
│   ├── Data.ts             ← PORT existing (DataModel.js)
│   ├── Pengukuran.ts       ← PORT existing
│   ├── District.ts         ← PORT existing + tambah field region
│   ├── Contractor.ts       ← BARU (untuk shortName mapping)
│   ├── User.ts             ← BARU
│   ├── Aoi.ts              ← BARU (header batch)
│   ├── Canal.ts            ← BARU (per-canal AOI row)
│   ├── AuditLog.ts         ← BARU
│   └── Notification.ts     ← BARU
├── routes/
│   ├── auth.ts             ← BARU
│   ├── aoi.ts              ← BARU (import + list)
│   ├── canal.ts            ← BARU (filter + assign + detail)
│   ├── penugasan.ts        ← BARU
│   ├── sync.ts             ← BARU (PouchDB push/pull)
│   ├── qc.ts               ← BARU (export PNG/TXT/Excel/PAT/ZPM32)
│   ├── parameter.ts        ← BARU (form parameter)
│   ├── data.ts             ← PORT existing (DataRoute.js)
│   ├── pengukuran.ts       ← PORT existing
│   ├── district.ts         ← PORT existing + region
│   ├── user.ts             ← BARU
│   ├── audit.ts            ← BARU
│   ├── notification.ts     ← BARU
│   └── reports.ts          ← BARU (agregasi)
├── controllers/
│   ├── ChartController.ts  ← PORT existing (chartjs-node-canvas + extend header)
│   ├── DataController.ts   ← PORT existing
│   ├── DistrictController.ts  ← PORT + region
│   ├── DefaultDistrictController.ts ← PORT existing (seeding)
│   ├── PengukuranController.ts ← PORT existing + admin-only enforce
│   ├── ClearTemp.ts        ← PORT existing
│   ├── AoiController.ts    ← BARU (parse Excel, validate, save)
│   ├── CanalController.ts  ← BARU
│   ├── PenugasanController.ts ← BARU
│   ├── SyncController.ts   ← BARU (algoritma di bawah)
│   ├── QcExportController.ts ← BARU
│   ├── UserController.ts   ← BARU
│   ├── AuthController.ts   ← BARU
│   ├── ReportsController.ts ← BARU
│   ├── AuditController.ts  ← BARU
│   └── NotificationController.ts ← BARU
├── services/
│   ├── excel/
│   │   ├── aoiParser.ts    ← parse Excel AOI (SheetJS)
│   │   ├── page2Export.ts  ← Excel parameter
│   │   ├── page3Export.ts  ← Excel kedalaman (PORT existing logic)
│   │   ├── patCsv.ts       ← Request PAT CSV UTM
│   │   └── zpm32.ts        ← ZPM32 Excel format
│   ├── chart/
│   │   ├── renderPng.ts    ← PORT existing exportAllChart
│   │   ├── headerPlugin.ts ← PORT + extend (Region/Distrik/Operator/Status)
│   │   └── thresholdLinePlugin.ts ← PORT existing
│   ├── filename/
│   │   └── outputName.ts   ← [district]-[YYMMDD]-[USV]-[urut][rev][qctype]
│   └── notify/
│       └── push.ts         ← SSE atau polling-friendly
├── utils/
│   ├── deadline.ts         ← deadlineInfo helper (sama dengan FE)
│   ├── shortName.ts        ← contractor mapping
│   ├── splitCanal.ts       ← > 999m logic
│   └── utm.ts              ← proj4 server (optional, untuk validasi)
├── seeds/
│   ├── districts.txt       ← PORT existing
│   ├── contractors.json    ← seed mapping awal
│   └── admin.ts            ← seed default admin user
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## Schema MongoDB (Mongoose)

### Existing — di-port persis (kompatibilitas data lama)

#### `Data` (`models/DataModel.js` existing)

Nested deeply: `Data > canal_data[] > data[]`. Lihat repo lama untuk full schema. Field penting:

```ts
type Data = {
  _id: ObjectId;
  batang_canal_id: string;
  canal_data: Array<{
    _id: ObjectId;
    canal_id: string;
    dimensi: { panjang: number; lebar: number; tinggi: number };
    order_no: string;
    operation_no: string;
    start: string; end: string;
    measure_point: string;
    water_level: string;
    depth_correction: string;
    bed_float: string;
    revision: string;
    qc_type: string;
    operator: string;
    qc_date: string;
    measure_date: string;       // ← BARU: di app lama belum jadi field eksplisit
    usv_code: string;
    district: { name: string; code: string };
    region?: string;            // ← BARU (slide 9 pptx)
    canal_upper_width: number;
    canal_bottom_width: number;
    canal_length: number;
    tranducer: number;
    lane: number;
    content_name: string;
    coord_x?: number;           // ← BARU (UTM Easting)
    coord_y?: number;           // ← BARU (UTM Northing)
    data: Array<{
      _id: ObjectId;
      lattitude: number;
      longitude: number;
      time: string;
      depth: number;
      sta: number;
      sta_distance: number;
    }>;
  }>;
};
```

> Catatan: tambahkan `measure_date`, `region`, `coord_x`, `coord_y` ke schema existing — backward compatible (field optional dengan default).

#### `Pengukuran` (singleton threshold)

```ts
type Pengukuran = {
  tidakLulus: number;
  toleransi: { batasAwal: number; batasAkhir: number };
  lulus: number;
};
```

PORT persis dari existing. Tetap singleton (1 dokumen di koleksi).

#### `District` (extended)

```ts
type District = {
  _id: ObjectId;
  districtName: string;          // existing
  districtId: string;            // existing — 4-char kode untuk filename
  regionName?: string;           // ← BARU (slide 9 pptx)
  contractorId?: ObjectId;       // ← BARU (link ke Contractor)
};
```

Seed dari `districts.txt` (existing pattern). Format `name|code`. Re-seed otomatis di `mongoose.connection.once('open')` (port `addAllDefaultDistricts`).

### Baru — koleksi tambahan

#### `Contractor`

```ts
type Contractor = {
  _id: ObjectId;
  fullName: string;          // "PT CIPTA BUANA SAMUDRA"
  shortName: string;         // "PT. CBS"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

Seed awal dari `contractors.json`:
```json
[
  {"fullName":"PT CIPTA BUANA SAMUDRA","shortName":"PT. CBS"},
  {"fullName":"PT PUTRA RIMBA NUSANTARA","shortName":"PT. PRN"},
  {"fullName":"PT MUSI NAULI LESTARI","shortName":"PT. MNL"},
  {"fullName":"PT SUMBER HIJAU PERMAI","shortName":"PT. SHP"}
]
```

#### `User`

```ts
type User = {
  _id: ObjectId;
  name: string;
  email: string;
  pinHash: string;              // bcrypt
  role: 'admin' | 'operator';
  usv: string | null;           // KBN01-05, null untuk admin
  status: 'aktif' | 'cuti';
  initials: string;
  productivityCache?: {
    kanal30d: number;
    passRate: number;
    reqcRate: number;
  };
  lastActiveAt: Date;
  createdAt: Date;
};
```

Seed default admin saat first boot.

#### `Aoi`

```ts
type Aoi = {
  _id: ObjectId;
  region: string;               // 'Palembang'
  area: string;                 // 'SUMSEL P1'
  vendor: string;               // 'PT. KARTA BHUMI NUSANTARA'
  notificationTitle: string;    // 'AOI QC Canal USV Notification'
  importedAt: Date;
  importedBy: ObjectId;         // User
  canalCount: number;
  sourceFile?: string;          // nama file Excel asli
};
```

#### `Canal` (1 row Excel AOI)

```ts
type Canal = {
  _id: ObjectId;
  aoiId: ObjectId;              // ref Aoi
  // dari Excel:
  district: string;             // "D.SUNGAI_BEYUKU"
  orderNo: string;              // unique, "2000349189"
  requestDate: Date;
  requestType: 'QC' | 'RE-QC';
  canalId: string;              // "SB180202"
  panjang: number;
  dimensi: string;              // "8X5X3"
  measurePoint: string;
  startDate: Date;
  finishDate: Date;
  contractor: string;           // full name
  coordX: number;               // UTM Easting
  coordY: number;               // UTM Northing
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Done';
  // assigning:
  assignedTo: ObjectId | null;  // User
  assignedAt: Date | null;
  usv: string | null;
  // outcome:
  qcOutput: string | null;      // filename TXT (saat Done)
  dataId: ObjectId | null;      // link ke Data document existing (post-input)
  // tracking:
  createdAt: Date;
  updatedAt: Date;
};
```

**Indexes**:
- `{ orderNo: 1 }` unique
- `{ assignedTo: 1, status: 1 }` (query "penugasan saya")
- `{ aoiId: 1 }`
- `{ contractor: 1, district: 1 }` (untuk "canal lain di kombinasi sama")
- `{ status: 1, requestDate: -1 }` (untuk list dengan sort)

#### `AuditLog`

```ts
type AuditLog = {
  _id: ObjectId;
  userId: ObjectId;
  userName: string;            // denormalized untuk display cepat
  userInitials: string;
  action: 'edit' | 'sync' | 'assign' | 'threshold' | 'login' | 'export' | 'import';
  kind: string;                // "Drag-edit kedalaman", "Sinkronisasi", dll
  target: string;              // "KBN01-K02 · STA 720"
  detail?: string;             // "2.710 → 2.840"
  ts: Date;
};
```

Indexes: `{ ts: -1 }`, `{ userId: 1, ts: -1 }`, `{ action: 1, ts: -1 }`.

TTL: 1 tahun (configurable).

#### `Notification`

```ts
type Notification = {
  _id: ObjectId;
  userId: ObjectId;
  kind: 'undangan' | 'konflik' | 'sync' | 'penugasan' | 'threshold';
  icon: string;
  color: 'brand' | 'rose' | 'emerald' | 'amber';
  title: string;
  body: string;
  read: boolean;
  ts: Date;
  link?: string;               // hash route
};
```

Indexes: `{ userId: 1, read: 1, ts: -1 }`.

## API endpoints

### Auth strategy — offline-first dilema

> Tension: app offline-first, tapi user juga butuh auth aman. Kalau pure SSO, hilang sinyal = gak bisa login. Kalau pure local PIN, lemah audit identitas.

**Roadmap auth bertahap**:

#### MVP / launch (Phase 1) — Opsi A: Local PIN + JWT cached 30 hari

- Login `POST /auth/login` `{ usv, pin }` → JWT signed (HS256, secret di env)
- JWT TTL: **30 hari** (sengaja panjang untuk offline tolerance)
- Client cache JWT di IndexedDB (lebih aman dari localStorage karena origin-scoped + larger quota)
- Offline buka app: pakai cached JWT, decode local, cek expiry
- Online tab focus: silent `POST /auth/refresh` → JWT baru (sliding window)
- Lupa PIN: admin reset via internal channel + new JWT
- ✅ Cocok untuk closed user group 10-20 operator, no Google Workspace requirement
- ❌ Tidak ada external identity audit

#### Tahun ke-2 (saat company adopt Google Workspace) — Opsi C: Hybrid SSO + local PIN

Mirip pattern banking app (BCA mobile, Jenius):

1. **First login**: wajib SSO Google OAuth (identity audit)
2. **App generate local PIN** (user pilih 4-6 digit)
3. **Subsequent login**: PIN aja (offline OK)
4. **Online silent re-auth**: tiap app fokus saat online → refresh SSO token di background
5. **Trust window**: PIN valid 30 hari sejak last successful SSO refresh
6. **Expired trust window** (offline > 30 hari): PIN ditolak, harus re-SSO saat online
7. **Lupa PIN**: harus SSO ulang (recovery via Google)
8. **Emergency** (lupa PIN + lapangan urgent): admin generate one-time recovery code via SMS/WA

Implementation outline:
```ts
// Trust window stored di server saat login
user.deviceTrust = { deviceId, lastSsoSyncAt, pinHash, trustWindowDays: 30 };

// Check di middleware
function requireAuth(req) {
  const { jwt } = req.cookies;
  const payload = verify(jwt);
  const trust = await DeviceTrust.findOne({ userId: payload.uid, deviceId: payload.did });
  const daysSinceSso = (Date.now() - trust.lastSsoSyncAt) / 86400000;
  if (daysSinceSso > trust.trustWindowDays) {
    throw new Error('TRUST_EXPIRED'); // client redirect ke SSO re-auth
  }
}
```

#### Jangan langsung Opsi B (SSO only)

- Access token TTL 1 jam → operator yang offline > 1 jam locked
- Workaround extend TTL 7 hari masih fragile
- Skip kecuali ada constraint regulatory yang wajibkan SSO mandatory

### Auth (`routes/auth.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/auth/login` | `{ usv, pin }` | `{ user }` + set cookie | public |
| POST | `/auth/logout` | — | `{ ok }` | auth |
| GET | `/auth/me` | — | `{ user }` | auth |
| POST | `/auth/change-pin` | `{ oldPin, newPin }` | `{ ok }` | auth |

### AOI ingestion (`routes/aoi.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/aoi/import` | multipart `xlsx` | `{ aoiId, canalCount, errors? }` | admin |
| GET | `/aois` | query `page, limit` | `{ data, total }` | auth |
| GET | `/aois/:id` | — | AOI + linked canals | auth |

### Canals (`routes/canal.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| GET | `/canals` | query `status, district, contractor, q, page` | `{ data, total }` | auth |
| GET | `/canals/:orderNo` | — | Canal + siblings | auth |
| POST | `/canals/assign` | `{ orderNos: [], assignedTo, usv }` | `{ updated }` | admin |
| POST | `/canals/unassign` | `{ orderNos: [] }` | `{ updated }` | admin |

### Penugasan (`routes/penugasan.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| GET | `/penugasan/mine` | query `tab` | grouped by contractor → district | auth |
| GET | `/penugasan/:canalId` | — | Canal detail + Data lookup | auth |

### Parameter (`routes/parameter.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/parameter/:canalId` | parameter object | `{ ok, dataId }` | auth |
| GET | `/parameter/:canalId` | — | parameter object | auth |
| PATCH | `/parameter/:canalId` | partial | `{ ok }` | auth |

### Data (PORT existing — `routes/data.ts`)

| Method | Path | Note |
|---|---|---|
| GET | `/version` | port |
| GET | `/alldatas` | port (admin) |
| GET | `/datas/:id` | port (MainData detail) |
| GET | `/dataschart/:id` | port (chart data) |
| GET | `/data/:id` | port (canal_data segment) |
| GET | `/datachart/:id` | port (chart per segment) |
| GET | `/detaildata/:id` | port (depth point detail) |
| POST | `/datas` | port (create MainData) |
| POST | `/data/:id` | port (push canal_data) |
| POST | `/detaildata/:id` | port (push depth point) |
| PATCH | `/datas/:id` | port (update MainData) |
| PATCH | `/data/:id` | port (update canal_data) |
| PATCH | `/detaildata/:id` | port (update depth point) |
| PATCH | `/updatechartdata/:id` | port (drag-save) |
| DELETE | `/alldatas`, `/datas/:id`, `/alldata/:id`, `/data/:id`, `/alldetaildata/:id`, `/detaildata/:id` | port semua |
| POST | `/exportallchart/:id` | port (PNG bulk) |
| DELETE | `/cleartmp` | port |

Polymorphic `:id` pattern (lihat `CLAUDE.md` existing) — wajib dipertahankan.

### Pengukuran (PORT existing — `routes/pengukuran.ts`)

| Method | Path | Role |
|---|---|---|
| GET | `/pengukuran` | auth |
| POST | `/pengukuran` | admin (baru — di app lama tidak ada gating) |
| PATCH | `/pengukuran/:id` | admin |
| DELETE | `/pengukuran/:id` | admin |

### District (PORT + extend — `routes/district.ts`)

| Method | Path | Role |
|---|---|---|
| GET | `/districts` | auth |
| POST | `/districts` | admin |
| PUT | `/districts/:id` | admin |
| DELETE | `/districts/:id?` | admin |

Extend: tambah field `regionName` & `contractorId` di body.

### QC export (`routes/qc.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/qc/export/png/:canalId` | — | PNG stream | auth |
| POST | `/qc/export/txt/:canalId` | — | TXT stream | auth |
| POST | `/qc/export/page2-xlsx/:canalId` | — | XLSX stream | auth |
| POST | `/qc/export/page3-xlsx/:canalId` | — | XLSX stream | auth |
| POST | `/qc/export/pat-csv/:canalId` | — | CSV stream | auth |
| POST | `/qc/export/zpm32/:canalId` | — | XLSX stream | auth |
| POST | `/qc/export/bulk` | `{ canalIds: [], formats: [] }` | ZIP stream | auth |
| POST | `/qc/export/screenshot-jpeg/:canalId` | — | JPEG stream | auth |

### Sync (PouchDB ↔ Mongo — `routes/sync.ts`)

| Method | Path | Body | Response | Role |
|---|---|---|---|---|
| POST | `/sync/push` | `{ docs: [...] }` | per-doc `{ id, ok, rev }` or `{ conflict }` | auth |
| GET | `/sync/pull?since=<seq>&limit=` | — | `{ changes: [...], lastSeq }` | auth |
| POST | `/sync/seed` | — | initial pull semua data operator | auth |

Detail algoritma di bawah.

### User management (`routes/user.ts`) — admin only

| Method | Path |
|---|---|
| GET | `/users` |
| POST | `/users` |
| PATCH | `/users/:id` |
| DELETE | `/users/:id` (soft delete) |
| POST | `/users/:id/reset-pin` |

### Audit (`routes/audit.ts`) — admin only

| Method | Path | Query |
|---|---|---|
| GET | `/audit` | `userId, action, from, to, page, limit` |
| GET | `/audit/recent` | `limit=5` (untuk dashboard activity feed) |

### Notifications (`routes/notification.ts`)

| Method | Path |
|---|---|
| GET | `/notifications/mine` |
| POST | `/notifications/:id/read` |
| POST | `/notifications/read-all` |
| GET | `/notifications/stream` (SSE — optional, untuk realtime) |

### Reports (`routes/reports.ts`) — admin only

| Method | Path | Query | Catatan |
|---|---|---|---|
| GET | `/reports/kpi` | `period` | total QC, pass rate, re-QC ratio, avg duration |
| GET | `/reports/trend` | `period, groupBy=day` | array { date, passRate } |
| GET | `/reports/per-region` | `period` | array { region/contractor, passRate, qcCount } |
| GET | `/reports/per-operator` | `period` | productivity table |
| GET | `/reports/breakdown` | `period` | `{ pass, tol, fail }` |

## Excel AOI parser (Phase 2)

`services/excel/aoiParser.ts`:

```ts
import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = ['District', 'Order No.', 'Request Date', 'Request Type',
  'Canal ID', 'Panjang', 'Dimensi', 'Measure Point', 'Start Date', 'Finish Date',
  'Contractor Name', 'Coordinate X', 'Coordinate Y', 'Status'];

export function parseAoiExcel(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  // Header AOI di baris 1-3
  const headerRange = XLSX.utils.decode_range(sheet['!ref']!);
  const region = sheet[XLSX.utils.encode_cell({ r: 1, c: 1 })]?.v?.trim();
  const area   = sheet[XLSX.utils.encode_cell({ r: 2, c: 1 })]?.v?.trim();
  const vendor = sheet[XLSX.utils.encode_cell({ r: 3, c: 1 })]?.v?.trim();
  if (!region || !area || !vendor) throw new Error('Header AOI (Region/Area/Vendor) tidak ditemukan');

  // Rows: header columns di baris 5, data dari baris 6
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 4 });

  // Validate
  const errors: Array<{ row: number; field: string; reason: string }> = [];
  const canals = rows.map((r: any, i: number) => {
    const errs: string[] = [];
    for (const col of REQUIRED_COLUMNS) if (r[col] == null) errs.push(`missing ${col}`);
    if (r['Order No.'] && !/^\d{10}$/.test(String(r['Order No.']))) errs.push('Order No bukan 10 digit');
    if (r['Measure Point'] && /\s/.test(String(r['Measure Point']))) errs.push('Measure Point ada spasi');
    if (errs.length) errors.push({ row: i + 6, field: 'multiple', reason: errs.join('; ') });
    return {
      district: r['District'],
      orderNo: String(r['Order No.']),
      requestDate: r['Request Date'],
      requestType: r['Request Type'],
      canalId: r['Canal ID'],
      panjang: Number(r['Panjang']),
      dimensi: r['Dimensi'],
      measurePoint: String(r['Measure Point']),
      startDate: r['Start Date'],
      finishDate: r['Finish Date'],
      contractor: r['Contractor Name'],
      coordX: Number(r['Coordinate X']),
      coordY: Number(r['Coordinate Y']),
      status: r['Status'] || 'Submitted',
    };
  });

  return { header: { region, area, vendor }, canals, errors };
}
```

## Chart PNG renderer (Phase 6 — port existing + extend)

`services/chart/renderPng.ts`:

```ts
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { headerPlugin } from './headerPlugin';
import { thresholdLinePlugin } from './thresholdLinePlugin';

const canvas = new ChartJSNodeCanvas({ width: 1147, height: 722, backgroundColour: 'white' });

export async function renderQcPng(canal: Canal, dataDoc: Data, pengukuran: Pengukuran, op: User) {
  const segment = dataDoc.canal_data.find(c => c.canal_id === canal.canalId)!;
  const points = segment.data;

  const labels = points.map(d => String(d.sta));
  const values = points.map(d => {
    const depth = Number(d.depth) + Number(segment.water_level) + Number(segment.tranducer)
                + Number(segment.bed_float) - Number(segment.depth_correction);
    return { value: depth * -1, color: thresholdColor(depth, pengukuran) };
  });

  return canvas.renderToBuffer({
    type: 'bar',
    data: { labels, datasets: [{ data: values.map(v => v.value), backgroundColor: values.map(v => v.color), ... }] },
    options: {
      _measurement: pengukuran,
      _metaRows: [                         // ← di-extend dari existing: tambah Region, Status
        ['ORDER NO', canal.orderNo],
        ['ID KANAL', canal.canalId],
        ['REGION', canal.district],
        ['DISTRICT', canal.district],
        ['WL', `${segment.water_level} m`],
        ['DIMENSI', canal.dimensi],
        ['QC DATE', formatDate(segment.qc_date)],
        ['MEASURE DATE', formatDate(segment.measure_date)],
        ['OPERATOR', op.name],
        ['USV', op.usv],
        ['STATUS QC', canal.status],
        ['KONTRAKTOR', getShortName(canal.contractor)],
      ],
      ...
    },
    plugins: [headerPlugin, thresholdLinePlugin],
  });
}
```

> Catatan: extend `_metaRows` dari existing — slide 8 pptx minta "Region, distrik, kontraktor" di tengah header. Plus tambah Operator, Status QC, USV.

## Output filename (`services/filename/outputName.ts`)

```ts
export function outputName(canal: Canal, op: User, urut: number, revision = 0): string {
  const district = await District.findOne({ districtName: canal.district });
  const districtCode = district?.districtId || canal.district.slice(0, 4);
  const yymmdd = formatYYMMDD(canal.qcDate);
  const usv = op.usv;
  const rev = `R${revision}`;
  const qct = canal.requestType === 'RE-QC' ? 'Q2' : 'Q1';
  return `${districtCode}-${yymmdd}-${usv}-${urut}${rev}${qct}`;
}
```

## Sync algorithm (Phase 4)

Custom REST sync — bukan CouchDB `_replicate`. Alasan: schema nested deep + drag-edit per titik = revision tree CouchDB akan membengkak cepat.

### Push (client → server)

Client PouchDB punya `changes({ since: lastPushSeq, live: true })`. Saat ada change:
1. Buffer + debounce (5 detik atau 50 docs)
2. `POST /sync/push` `{ docs: [...] }`
3. Server proses tiap doc:
   ```ts
   for (const doc of req.body.docs) {
     const existing = await Model.findById(doc._id);
     if (!existing) {
       // insert baru
       await Model.create(doc);
       results.push({ id: doc._id, ok: true, rev: '1-...' });
     } else if (existing.updatedAt > doc.clientBase) {
       // conflict
       results.push({ id: doc._id, conflict: { lokal: doc, server: existing } });
     } else {
       // update OK
       await Model.findByIdAndUpdate(doc._id, doc);
       results.push({ id: doc._id, ok: true });
     }
   }
   ```
4. Client terima response: jika `ok` → update `lastPushSeq`; jika `conflict` → tambah ke conflict queue (UI di `/konflik`)

### Pull (server → client)

Client poll `GET /sync/pull?since=<lastPullSeq>` setiap 30 detik (atau saat tab fokus kembali):
1. Server query `find({ updatedAt: { $gt: lastPullSeq } }).sort({ updatedAt: 1 }).limit(100)`
2. Return `{ changes: [docs...], lastSeq: maxUpdatedAt }`
3. Client `db.bulkDocs(changes)` ke PouchDB

### Conflict detection scope

Per-document timestamp-based:
- Setiap doc punya `clientRev` (local PouchDB rev) + `serverRev` (Mongo `__v` atau `updatedAt`)
- Saat push: bandingkan `doc.serverBase` (saat client terakhir pull) vs current `existing.updatedAt`
- Jika beda → conflict, return both versions

### Conflict resolution (per field type)

| Field type | Strategy default | Override |
|---|---|---|
| Parameter (water_level, dll) | last-write-wins (timestamp newer wins) | Admin bisa pilih manual di `/konflik` |
| Kedalaman point (drag edit) | **manual** (selalu return conflict, butuh UI pick) | — |
| Status, assignedTo (admin field) | server wins (operator tidak boleh override) | — |
| Threshold (admin field) | admin wins | — |

### Initial seed (saat login)

`POST /sync/seed` → server return semua doc relevan untuk user (penugasan saya + master district/contractor/threshold + parameter draft). Client `bulkDocs` ke PouchDB.

## Audit middleware

Setiap mutation endpoint (POST/PATCH/PUT/DELETE) di-wrap dengan audit middleware:

```ts
export const audit = (action: string, kindFromBody: (req) => string, targetFromBody: (req) => string) =>
  async (req, res, next) => {
    const original = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode < 400) {
        AuditLog.create({
          userId: req.session.userId,
          userName: req.session.userName,
          userInitials: req.session.userInitials,
          action,
          kind: kindFromBody(req),
          target: targetFromBody(req),
          detail: req.body?.detail,
          ts: new Date(),
        }).catch(err => req.log.error(err));
      }
      return original(data);
    };
    next();
  };
```

## Validasi input (zod)

Di tiap route, validate body sebelum lanjut:

```ts
import { z } from 'zod';

const assignSchema = z.object({
  orderNos: z.array(z.string().regex(/^\d{10}$/)).min(1),
  assignedTo: z.string().regex(/^[0-9a-f]{24}$/),
  usv: z.enum(['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05']),
});

router.post('/canals/assign', requireRole('admin'), async (req, res) => {
  const body = assignSchema.parse(req.body);
  ...
});
```

## Logging (`pino`)

Ganti `console.log` existing dengan pino structured logger. Setiap request punya `req.log` (via `pino-http`). Production: ship ke Loki / Cloudwatch / Sentry.

## Backup strategy

- MongoDB dump cron daily (3am local) → upload S3 / cloud storage
- Retention: 30 hari rolling
- Smoke test restore monthly

## Tests

- **Unit (Vitest)**: domain helpers (deadline, splitCanal, outputName, shortName)
- **Integration (Vitest + mongo-memory-server)**: aoiParser, sync push/pull, conflict detection, audit middleware
- **E2E (Playwright)**: full flow login → import AOI → assign → operator input → sync → export

## Migration script (Phase 8, opsional)

Jika perlu migrate data dari app lama ke schema baru:

```ts
// scripts/migrate-from-old.ts
const oldDatas = await OldData.find();
for (const d of oldDatas) {
  for (const segment of d.canal_data) {
    // Buat Canal doc (kalau belum ada matching orderNo)
    // Buat Aoi header doc (jika perlu)
    // Link Data._id ke Canal.dataId
  }
}
```

## Security checklist

- [ ] `helmet` untuk security headers
- [ ] CORS strict origin (bukan `origin: true` seperti existing)
- [ ] Session cookie: `httpOnly`, `secure` (di prod), `sameSite: 'lax'`
- [ ] Rate limit `/auth/login` (5 attempt per IP per 15min)
- [ ] PIN hash bcrypt cost 12
- [ ] Validate semua input dengan zod
- [ ] Sanitize Mongo query (mongoose default OK; jangan `eval`/`$where`)
- [ ] File upload size limit (10 MB)
- [ ] Mime type whitelist untuk Excel upload
- [ ] CSP header
- [ ] Env vars: jangan commit `.env`, pakai `.env.example`

## Deployment

- Multi-stage Dockerfile:
  - Stage 1: `node:20-bullseye` build client (Vite) + server (tsc)
  - Stage 2: `node:20-bullseye-slim` runtime, install native deps cairo/pango/libgif/librsvg (untuk canvas)
- `docker-compose.prod.yml`: node + mongo + caddy (HTTPS) + redis (optional)
- Health check: `GET /health` → `{ status, mongo, version }`
- Graceful shutdown: drain requests + close mongo
