# Frontend implementation plan

> Detail implementasi frontend per page, komponen, state, dan test. Acuan visual & interaksi: `demo/`. Acuan domain: `DOMAIN.md`. Master roadmap: `PLAN.md`.

## Stack frontend

```
Vite 5 + React 18 + TypeScript 5
Tailwind CSS 3 + Lucide icons
React Router v6 (lazy routes)
TanStack Query v5 (server state cache + sync)
Zustand (UI state: auth, theme, role)
PouchDB browser + pouchdb-find (offline cache)
Chart.js 4 + chartjs-plugin-dragdata + chartjs-plugin-annotation
Leaflet 1.9 + proj4js (UTM 48S → WGS84)
SheetJS (xlsx) (import Excel di client)
date-fns (date helpers, deadlineInfo)
react-hook-form + zod (form state + validasi)
```

## Struktur folder

```
client/
├── public/
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx                  ← Router root + AuthProvider + ThemeProvider
│   ├── router.tsx               ← lazy routes
│   ├── components/
│   │   ├── ui/                  ← Button, Input, Badge, Modal, Drawer, Toast (Tailwind primitives)
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomTabNav.tsx
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── OfflineBanner.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleSwitcher.tsx
│   │   ├── undangan/
│   │   │   ├── UndanganList.tsx
│   │   │   ├── UndanganDetail.tsx
│   │   │   ├── UndanganBaru.tsx (wizard 4-step)
│   │   │   ├── DeadlineBadge.tsx
│   │   │   ├── AoiHeaderCards.tsx
│   │   │   └── ImportExcelDialog.tsx
│   │   ├── penugasan/
│   │   │   ├── PenugasanList.tsx (grouped Kontraktor → Distrik)
│   │   │   ├── PenugasanDetail.tsx (mini-map Leaflet)
│   │   │   ├── CanalCard.tsx
│   │   │   └── ContractorGroup.tsx
│   │   ├── lapangan/
│   │   │   ├── ParameterForm.tsx (Budat + Measure Date clamp)
│   │   │   ├── KedalamanInput.tsx (table + chart drag)
│   │   │   ├── DepthChart.tsx (Chart.js + drag + threshold)
│   │   │   ├── DropZoneCSV.tsx
│   │   │   └── GpsCaptureButton.tsx
│   │   ├── qc/
│   │   │   ├── QcProcessing.tsx (list output + export buttons)
│   │   │   ├── ExportBulkDialog.tsx
│   │   │   └── OutputCard.tsx
│   │   ├── konflik/
│   │   │   ├── KonflikList.tsx
│   │   │   ├── SingleFieldResolver.tsx
│   │   │   ├── MultiFieldResolver.tsx
│   │   │   └── ConflictTrigger.tsx (demo only)
│   │   ├── peta/
│   │   │   ├── PetaPage.tsx (Leaflet)
│   │   │   ├── canalMarker.tsx
│   │   │   └── utmUtil.ts (proj4js helper)
│   │   ├── distrik/
│   │   │   ├── DistrikList.tsx (grouped by region — extends existing)
│   │   │   └── DistrikForm.tsx
│   │   ├── pengaturan/
│   │   │   ├── PengaturanPage.tsx
│   │   │   ├── ThresholdSlider.tsx (admin-only lock)
│   │   │   └── StorageStatus.tsx
│   │   ├── kalender/
│   │   │   ├── KalenderPage.tsx (month grid + day side panel)
│   │   │   └── DayEvents.tsx
│   │   ├── notifikasi/
│   │   │   ├── NotifInbox.tsx
│   │   │   └── NotifBadge.tsx
│   │   ├── users/ (admin)
│   │   │   ├── UsersList.tsx
│   │   │   └── UserForm.tsx
│   │   ├── reports/ (admin)
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── PassRateTrend.tsx
│   │   │   ├── PerRegionBar.tsx
│   │   │   └── OperatorProductivity.tsx
│   │   ├── audit/ (admin)
│   │   │   ├── AuditLog.tsx
│   │   │   └── AuditFilter.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── StatCards.tsx
│   │   │   ├── LiveActivity.tsx
│   │   │   └── LiveClock.tsx
│   │   ├── help/
│   │   │   ├── HelpPage.tsx
│   │   │   ├── KeyboardShortcuts.tsx
│   │   │   ├── Glossary.tsx
│   │   │   └── Faq.tsx
│   │   ├── walkthrough/
│   │   │   ├── TourOverlay.tsx
│   │   │   └── tourSteps.ts (8 steps)
│   │   └── cmdk/
│   │       └── CommandPalette.tsx
│   ├── stores/
│   │   ├── auth.ts (Zustand)
│   │   ├── theme.ts (dark mode)
│   │   ├── ui.ts (drawer open, sidebar collapsed)
│   │   └── sync.ts (queue state derived dari PouchDB)
│   ├── db/
│   │   ├── pouch.ts (DB instance per user)
│   │   ├── sync.ts (custom REST sync handler)
│   │   ├── conflict.ts (detect + resolve)
│   │   └── seed.ts (initial pull saat login)
│   ├── api/
│   │   ├── client.ts (axios + interceptor)
│   │   ├── aoi.ts (import, list, detail)
│   │   ├── canals.ts (list, detail, assign)
│   │   ├── penugasan.ts
│   │   ├── parameter.ts
│   │   ├── kedalaman.ts
│   │   ├── qc.ts (export endpoints)
│   │   ├── users.ts
│   │   ├── reports.ts
│   │   ├── audit.ts
│   │   ├── notifications.ts
│   │   ├── pengukuran.ts (port existing)
│   │   ├── districts.ts (port existing)
│   │   ├── data.ts (port existing CRUD)
│   │   └── auth.ts
│   ├── domain/
│   │   ├── deadline.ts (deadlineInfo helper)
│   │   ├── depth.ts (final depth formula + reverse)
│   │   ├── threshold.ts (color logic)
│   │   ├── shortName.ts (contractor mapping)
│   │   ├── fileName.ts (output naming)
│   │   ├── splitCanal.ts (kanal > 999m auto-split)
│   │   └── utm.ts (UTM 48S → WGS84)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRole.ts
│   │   ├── useOnline.ts (navigator.onLine + ping)
│   │   ├── usePouch.ts
│   │   ├── useToast.ts
│   │   └── useShortcuts.ts (⌘K, ESC, ⌘P)
│   ├── styles/
│   │   └── globals.css (port style.css demo)
│   └── lib/
│       └── lucide.ts (icon barrel)
└── tests/
    ├── domain/ (unit)
    ├── components/ (component test via Vitest + Testing Library)
    └── e2e/ (Playwright untuk flow critical)
```

## Routing

Pakai React Router v6, lazy load semua route page. Wrap dengan `<Suspense fallback={<SplashScreen />}>`.

```tsx
const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute><RootLayout /></ProtectedRoute>,
    children: [
      { path: '/',                       element: <DashboardPage /> },
      { path: '/kalender',               element: <KalenderPage /> },
      { path: '/undangan',               element: <UndanganList /> },
      { path: '/undangan/baru',          element: <UndanganBaru />,    requireRole: 'admin' },
      { path: '/undangan/:orderNo',      element: <UndanganDetail /> },
      { path: '/penugasan',              element: <PenugasanList /> },
      { path: '/penugasan/:canalId',     element: <PenugasanDetail /> },
      { path: '/lapangan/parameter/:canalId', element: <ParameterForm /> },
      { path: '/lapangan/kedalaman/:canalId', element: <KedalamanInput /> },
      { path: '/qc',                     element: <QcProcessing /> },
      { path: '/peta',                   element: <PetaPage /> },
      { path: '/konflik',                element: <KonflikList /> },
      { path: '/distrik',                element: <DistrikList />,     requireRole: 'admin' },
      { path: '/notifikasi',             element: <NotifInbox /> },
      { path: '/pengaturan',             element: <PengaturanPage /> },
      { path: '/users',                  element: <UsersList />,       requireRole: 'admin' },
      { path: '/reports',                element: <ReportsPage />,     requireRole: 'admin' },
      { path: '/audit',                  element: <AuditLog />,        requireRole: 'admin' },
      { path: '/help',                   element: <HelpPage /> },

      // PORT EXISTING APP LAMA (Phase 1) — admin entrypoint untuk CRUD raw
      { path: '/admin/maindata',                                element: <MainDataList />, requireRole: 'admin' },
      { path: '/admin/maindata/add',                            element: <AddMainData />,  requireRole: 'admin' },
      { path: '/admin/maindata/:id/edit',                       element: <EditMainData />, requireRole: 'admin' },
      { path: '/admin/data/:id',                                element: <DataList />,     requireRole: 'admin' },
      { path: '/admin/data/:id/add',                            element: <AddData />,      requireRole: 'admin' },
      { path: '/admin/data/:id/edit',                           element: <EditData />,     requireRole: 'admin' },
      { path: '/admin/data/:id/chart',                          element: <ChartData /> },
      { path: '/admin/data/:id/chart/preview',                  element: <ChartPreview /> },
      { path: '/admin/data/:id/detail',                         element: <DetailDataList /> },
      { path: '/admin/data/:id/detail/:detailId/edit',          element: <EditDetailData /> },
      { path: '/admin/data/:id/detail/:detailId/chart',         element: <ChartDetailData /> },
    ]
  },
  { path: '*', element: <NotFoundPage /> },
];
```

> Catatan: route `/admin/maindata/*` adalah fallback CRUD untuk admin saat ada masalah data — flow normal pakai `/undangan` → `/penugasan` → `/lapangan/*`.

## State management

### Server state — TanStack Query

```tsx
// useCanals.ts
export function useCanals(filter: { status?, district?, contractor?, q? }) {
  return useQuery({
    queryKey: ['canals', filter],
    queryFn: () => api.canals.list(filter),
    staleTime: 30_000,
  });
}

// Mutations auto-invalidate
export function useAssignCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.canals.assign,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['canals'] }),
  });
}
```

### UI state — Zustand

```tsx
// stores/auth.ts
type AuthStore = {
  user: User | null;
  role: 'admin' | 'operator';
  setUser: (u: User | null) => void;
  setRole: (r: AuthStore['role']) => void;
};
export const useAuth = create<AuthStore>(...);

// stores/theme.ts
type ThemeStore = { theme: 'light' | 'dark'; toggle: () => void };
```

### Offline state — PouchDB + custom hooks

```tsx
// hooks/usePouch.ts
export function usePouchDoc<T>(id: string) {
  const [doc, setDoc] = useState<T | null>(null);
  useEffect(() => {
    const db = getPouch();
    db.get(id).then(setDoc).catch(() => setDoc(null));
    const changes = db.changes({ since: 'now', live: true, doc_ids: [id] })
      .on('change', () => db.get(id).then(setDoc));
    return () => changes.cancel();
  }, [id]);
  return doc;
}
```

## Per-page implementation detail

> Untuk tiap page di bawah, lihat juga reference HTML di `demo/index.html` template `view-*`.

### 1. LoginPage (`/login`)

- Form: USV code + PIN
- `react-hook-form` + `zod` validasi
- `api.auth.login` → set session cookie + `useAuth.setUser`
- Redirect ke `/`
- Demo reference: template `view-login`

### 2. DashboardPage (`/`)

- KPI stat cards (4): Undangan aktif, Penugasan saya, QC pass rate, Antrian sync
- "Penugasan minggu ini" list (port `renderDashboard`)
- Status QC terbaru (3 latest)
- **Live activity feed**: TanStack Query polling 30s ke `api.audit.recent(5)`
- **Live clock**: setInterval 1s, format ID locale
- Demo reference: template `view-dashboard`

### 3. KalenderPage (`/kalender`)

- Month grid (port `renderCalendar`)
- Klik tanggal → side panel daftar event (penugasan + undangan + deadline)
- Toggle Month/Week/Day view (Week & Day mode TBD post-MVP)
- Demo reference: template `view-kalender`

### 4. UndanganList (`/undangan`)

- Header card Region/Area/Vendor (AOI header)
- Tabel kolom: Order No, Canal ID, District, Contractor, Request Date, **Deadline badge**, Status
- Search live + filter status (Submitted/Assigned/In Progress/Done)
- Tombol "Import Excel AOI" → `<ImportExcelDialog>` (admin only)
- Demo reference: template `view-undangan`

### 5. UndanganDetail (`/undangan/:orderNo`)

- Header: Order No + badge status + badge deadline
- 3 card Region/Area/Vendor
- Detail grid: semua field AOI per canal (Order No, Canal ID, District, Contractor, Panjang/Dimensi, Measure Point, Coord X/Y, SPK Start–Finish, Deadline, Operator/USV, qcOutput jika ada)
- Section "Canal lain di kontraktor/distrik sama"
- Timeline: AOI diterima → Assign → QC selesai
- Tombol "Assign petugas" (admin only)
- Demo reference: template `view-undangan-detail`

### 6. UndanganBaru (`/undangan/baru`) — admin only

- Wizard 4-step: Klien & region → Daftar kanal → Jadwal & petugas → Review
- Auto-split kanal > 999m (badge "2 segmen" kuning)
- Auto-derive singkatan kontraktor
- Form validation real-time (port `attachValidators`)
- Demo reference: template `view-undangan-baru`

### 7. PenugasanList (`/penugasan`)

- Tab Aktif/Selesai
- **Grouping: Kontraktor → Distrik → Canal cards** (jawab pertanyaan WM)
- Tiap section kontraktor: chip ringkasan (jumlah kanal, total meter, deadline terdekat)
- Klik card → `/penugasan/:canalId`
- Demo reference: template `view-penugasan` + `renderPenugasan`

### 8. PenugasanDetail (`/penugasan/:canalId`)

- Header: Canal ID + badge status + badge deadline + "Dari undangan PAT-XXXX"
- Info grid: Canal ID, Order No, Request Type, District, Contractor, Panjang/Dimensi, Measure Point, SPK, Request Date, Operator/USV, Coord UTM, QC Type
- **Mini-map Leaflet** (lokasi canal)
- Progress: Parameter → Kedalaman → QC Processing
- Widget cuaca (opsional, post-MVP)
- Demo reference: template `view-penugasan-detail` + `renderPenugasanDetail`

### 9. ParameterForm (`/lapangan/parameter/:canalId`)

- Auto-fill dari assignment (read-only field auto-filled, editable cuma yang perlu diisi operator)
- Section "Informasi kanal": Canal ID, Order No, Operation No, District, Contractor, Measure Point, Start/End STA, Panjang, Dimensi, Coord X/Y (UTM)
- Section "Parameter pengukuran": Water level, Tranducer, Bed float, Depth correction, QC Type, Revision
- Section **"Tanggal"**:
  - QC Date / Budat (date input)
  - Measure Date (date input) **dengan clamp logic**:
    - on change: if value > finishDate → set ke finishDate + toast warning
- Sidebar: Validasi check list, Preview filename, Tombol next ke Kedalaman
- Save → PouchDB doc `parameter:<canalId>:<rev>` (offline-first)
- Demo reference: template `view-lapangan-parameter` + `attachParameterDateLogic`

### 10. KedalamanInput (`/lapangan/kedalaman/:canalId`)

- Tabel STA editable (40 rows-ish), kolom: #, STA, Lat, Lng, Depth, Date, Status
- Sidebar:
  - **Chart.js draggable bar** dengan threshold annotation lines
  - Drop zone CSV import
  - Tombol "Kirim ke QC processing"
- Tombol top: Import CSV, Capture GPS, Simpan
- Drag bar event → update PouchDB + invalidate query + re-render row + toast
- Multi-Excel import page 3 (existing fitur, port dari `DataList.js`)
- Demo reference: template `view-lapangan-kedalaman` + `renderDepth`

### 11. QcProcessing (`/qc`)

- Hero card "QC Processing Engine"
- Grid output cards (canal yang sudah Done): mini chart preview + stat pass/tol/fail + link source
- Export bulk section: tombol TXT, PNG Chart, Excel page 2 & 3, Request PAT CSV, ZPM32 Excel
- Klik tombol → call `api.qc.export(...)` → download via `Blob`
- Admin: extra tombol "Arsip"
- Demo reference: template `view-qc` + `handleExport`

### 12. PetaPage (`/peta`)

- Full-screen Leaflet
- Marker per canal (color by status), popup dengan info + link detail
- Sample STA markers warna threshold
- Filter Aktif/Selesai
- UTM → WGS84 via `proj4js`
- Demo reference: template `view-peta` + `renderMap`

### 13. KonflikList (`/konflik`)

- Tombol "Trigger konflik baru" (demo only)
- 2 jenis kartu konflik:
  - Single-field (kedalaman): side-by-side card "Versi kamu vs Versi server" + radio pick
  - Multi-field (parameter): table per-field + dropdown lokal/server
- Tombol "Selesaikan" → animasi slide-out
- Demo reference: template `view-konflik` + `triggerConflict`, `resolveConflict`

### 14. DistrikList (`/distrik`) — admin only

- Grouped per Region (extends existing — tambah field region per distrik)
- Card per region: list distrik dengan kode 4-char
- Tombol "Tambah distrik" → form modal
- Demo reference: template `view-distrik`

### 15. PengaturanPage (`/pengaturan`)

- Section Threshold (admin-only, lock untuk operator):
  - Slider live (re-color chart kedalaman real-time)
  - 4 input numeric (lulus, tidakLulus, batasAwal, batasAkhir)
  - Preview legend
- Section Akun (semua user)
- Section Penyimpanan lokal (PouchDB size, doc count, sync terakhir, tombol Sinkron paksa / Ekspor backup / Reset lokal)
- Demo reference: template `view-pengaturan` + `renderPengaturan`

### 16. NotifInbox (`/notifikasi`)

- List notifikasi (port `renderNotifikasi`)
- Tandai dibaca per item / semua
- Update badge di sidebar + tab title (port `updateTitleBadge`)
- Demo reference: template `view-notifikasi`

### 17. UsersList (`/users`) — admin only

- KPI cards (total, admin, USV terpasang, productivity avg)
- Tabel operator dengan produktivitas bar
- Tombol "Tambah operator" → form modal
- Demo reference: template `view-users` + `renderUsers`

### 18. ReportsPage (`/reports`) — admin only

- 4 KPI cards (Total QC, Pass rate, Re-QC ratio, Avg duration)
- Line chart trend 30 hari (TanStack Query → server agregasi)
- Horizontal bar per region
- Donut breakdown pass/tol/fail
- Tabel operator productivity
- Period selector (7/30/90/custom)
- Demo reference: template `view-reports` + `renderReports`

### 19. AuditLog (`/audit`) — admin only

- Timeline filter user/action/date
- Pakai TanStack Query infinite scroll
- Demo reference: template `view-audit` + `renderAudit`

### 20. HelpPage (`/help`)

- Keyboard shortcuts table
- Glossary AOI/STA/Measure Date/dll (port dari demo)
- FAQ (collapsible)
- Quick start CTA → trigger walkthrough tour
- Demo reference: template `view-help`

## Domain helpers (semua di `src/domain/`)

### `deadline.ts`

```tsx
export function deadlineInfo(requestDate: string, today: Date = new Date()) {
  const req = new Date(requestDate + 'T00:00:00');
  const dl = new Date(req); dl.setDate(dl.getDate() + 4);
  const diff = Math.round((dl.getTime() - today.getTime()) / 86_400_000);
  const dlStr = dl.toISOString().slice(0, 10);
  let label: string, tone: 'rose' | 'amber' | 'emerald';
  if (diff < 0)        { label = `LEWAT ${Math.abs(diff)} hari`; tone = 'rose'; }
  else if (diff === 0) { label = 'Deadline hari ini';            tone = 'rose'; }
  else if (diff <= 2)  { label = `Sisa ${diff} hari`;            tone = 'amber'; }
  else                 { label = `Sisa ${diff} hari`;            tone = 'emerald'; }
  return { deadline: dlStr, diff, label, tone };
}
```

### `depth.ts`

```tsx
type DepthParams = { rawDepth: number; waterLevel: number; tranducer: number; bedFloat: number; depthCorrection: number; };

export function finalDepth(p: DepthParams): number {
  return (p.rawDepth + p.waterLevel + p.tranducer + p.bedFloat - p.depthCorrection) * -1;
}

export function rawDepthFromFinal(displayed: number, p: Omit<DepthParams, 'rawDepth'>): number {
  return displayed - (p.waterLevel + p.tranducer + p.bedFloat - p.depthCorrection);
}
```

### `threshold.ts`

```tsx
type Threshold = { lulus: number; tidakLulus: number; batasAwal: number; batasAkhir: number; };

export function thresholdStatus(depth: number, t: Threshold): 'pass' | 'tolerance' | 'notpass' {
  if (depth >= t.lulus) return 'pass';
  if (depth >= t.batasAwal && depth < t.batasAkhir) return 'tolerance';
  return 'notpass';
}
```

### `splitCanal.ts`

```tsx
export function splitCanal(panjang: number): Array<{ startSta: number; endSta: number; length: number }> {
  if (panjang <= 999) return [{ startSta: 0, endSta: panjang, length: panjang }];
  return [
    { startSta: 0,   endSta: 500,     length: 500 },
    { startSta: 500, endSta: panjang, length: panjang - 500 },
  ];
}
```

### `fileName.ts`

```tsx
type FileNameParams = { districtCode: string; qcDate: string; usv: string; urut: number; revision: number; qcType: 'QC' | 'RE-QC'; };

export function outputFilename(p: FileNameParams): string {
  const yymmdd = p.qcDate.replace(/-/g, '').slice(2);
  const rev = `R${p.revision}`;
  const qct = p.qcType === 'RE-QC' ? 'Q2' : 'Q1';
  return `${p.districtCode}-${yymmdd}-${p.usv}-${p.urut}${rev}${qct}`;
}
```

### `utm.ts`

```tsx
import proj4 from 'proj4';
proj4.defs('EPSG:32748', '+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs');

export function utmToLatLng(x: number, y: number): [number, number] {
  const [lng, lat] = proj4('EPSG:32748', 'EPSG:4326', [x, y]);
  return [lat, lng];
}
```

## Form validation (react-hook-form + zod)

### Parameter form schema

```tsx
const parameterSchema = z.object({
  canalId: z.string().min(1),
  orderNo: z.string().regex(/^\d{10}$/, 'Order No harus 10 digit numerik'),
  operationNo: z.string().refine(v => v === '0010', { message: 'Warning: bukan default 0010' }),
  measurePoint: z.string().regex(/^\d+$/, 'Wajib numerik tanpa spasi'),
  waterLevel: z.number().refine(v => Number((v % 0.001).toFixed(3)) === 0, 'Max 3 angka di belakang titik'),
  tranducer: z.number(),
  bedFloat: z.number(),
  depthCorrection: z.number(),
  qcType: z.enum(['QC', 'RE-QC']),
  revision: z.string().regex(/^\d{3}$/),
  qcDate: z.string(),
  measureDate: z.string(),
}).refine(d => d.panjangKanal === sumOfSta, 'Panjang kanal harus = Σ STA');
```

## Komponen kunci yang harus identik dengan demo

### DepthChart.tsx

Wajib pakai 3 plugin Chart.js sama dengan demo:
- `chart.js@4.4.1`
- `chartjs-plugin-annotation@3.0.1` (threshold lines)
- `chartjs-plugin-dragdata@2.3.1` (drag bar)

Pada `onDragEnd`:
1. Hitung raw depth via `rawDepthFromFinal`
2. Update PouchDB doc `kedalaman:<canalId>:<sta>`
3. Toast warning "masuk antrian sync"
4. Re-color bar via `thresholdStatus`

### LeafletMap di PetaPage + PenugasanDetail

- CARTO Voyager tiles (sama dengan demo)
- Custom divIcon untuk pin (sama style CSS dari demo)
- Convert UTM input → WGS84 via `utmToLatLng`

## Service worker / PWA (post-MVP)

- Workbox precache shell HTML/CSS/JS
- Runtime cache API GET (stale-while-revalidate)
- IndexedDB akses langsung via PouchDB
- Install prompt: tampil setelah user pakai app 3x

## Testing strategy

- **Unit**: `src/domain/*` 100% coverage (deadline, depth, threshold, fileName, splitCanal, utm)
- **Component**: ParameterForm clamp logic, PenugasanList grouping, DepthChart drag handler (Vitest + Testing Library)
- **E2E (Playwright)**: 5 critical flows
  1. Login → dashboard
  2. Import AOI Excel → list → detail
  3. Assign canal → operator lihat di Penugasan saya
  4. Offline mode → input parameter → online → sync
  5. Drag chart → save → export PNG download

## Performance

- React.lazy + Suspense untuk semua page
- TanStack Query staleTime 30s default
- PouchDB indexes via `pouchdb-find`
- Chart.js: gunakan `decimation` plugin untuk dataset besar
- Leaflet: marker clustering jika > 50 marker
- Bundle target: < 500 KB initial, lazy chunks < 200 KB each

## Accessibility

- Semua interactive: keyboard navigable
- Focus visible (outline brand color)
- ARIA labels untuk icon-only buttons
- Color contrast WCAG AA minimum
- Reduced motion: respect `prefers-reduced-motion`

## i18n (post-MVP)

- App default Bahasa Indonesia
- Pakai `react-i18next` jika perlu English
- Date format pakai `date-fns/locale/id`

---

## Demo subset — yang WAJIB dipertahankan di production

> Tiap "touch" di demo yang sudah disepakati harus tetap hadir di app produksi. Ini check-list lengkap supaya tidak ada yang hilang saat port.

### Layout & navigation
- [ ] Top nav: logo + version chip (`v2.0 · ops`)
- [ ] Sidebar dengan grup label uppercase (`WORKSPACE`, `LAPANGAN`, `QC`, `MANAJEMEN`)
- [ ] Nav-link active state dengan gradient background + ring
- [ ] Mobile bottom tab nav (5 ikon: Home/Kalender/Tugas/Peta/Akun)
- [ ] Sidebar collapse di mobile
- [ ] Splash screen (port existing + suppress di URL match `viewdata`)
- [ ] Global breadcrumb (port existing)
- [ ] Storage usage card di sidebar bawah (`PouchDB · 14.2 MB / 50 MB` + progress bar)

### Theming
- [ ] **Dark mode toggle** di top nav (icon sun/moon)
- [ ] Persisted di localStorage
- [ ] Full CSS override semua bg/text/border/badge colors (lihat `demo/style.css` section "DARK MODE")
- [ ] Default light mode

### Command palette (⌘K)
- [ ] Tombol "Cari" + kbd badge `⌘K` di top nav
- [ ] Shortcut: `Cmd+K` / `Ctrl+K` buka palette, `ESC` tutup, `↑↓` navigasi, `↵` pilih
- [ ] Fuzzy search 19+ items: semua route + actions (toggle role, theme, conn, trigger konflik, tour, print, force sync)
- [ ] Mouse hover juga update active item
- [ ] Render via React Portal ke `#cmdk-root`

### Walkthrough tour
- [ ] **8-step tour** (lihat `tourSteps.ts`):
  1. Dashboard
  2. Command palette ⌘K
  3. Role switcher
  4. Penugasan saya
  5. Drag chart kedalaman
  6. Offline simulator
  7. Sync queue
  8. Peta penugasan
- [ ] Tombol "Tour" di top nav
- [ ] **Auto-trigger first visit** (track `tourSeen` di localStorage)
- [ ] Spotlight overlay (transparan + box-shadow inset huge dark)
- [ ] Tooltip card follow target element + dots indicator
- [ ] Tombol Sebelumnya/Lanjut + Selesai di step terakhir
- [ ] Navigasi antar route otomatis saat next step butuh page lain

### Role hierarchy
- [ ] **Role pill** di top nav (Admin = amber, Operator = blue)
- [ ] Klik → swap role (demo only; production sesuaikan dengan `useAuth().user.role`)
- [ ] Body class `role-admin` / `role-operator` (CSS `body.role-operator [data-min-role="admin"] { display: none }`)
- [ ] Lock badge "🔒 Admin-only" di field admin-only saat operator
- [ ] CSS `lock-overlay` (opacity .55 + pointer-events none) untuk visual indicator
- [ ] Page "Akses terbatas" saat operator akses URL admin via direct hash (NoAccessPage component)

### Sync & connectivity
- [ ] **Online/Offline toggle** di top nav (icon wifi/wifi-off)
- [ ] Persisted state (di production: pakai `navigator.onLine` + listener)
- [ ] **Banner kuning** slide-down `Mode offline aktif...` saat offline
- [ ] **Sync drawer** slide-in dari kanan (port `sync-drawer`)
- [ ] Queue badge merah di top nav saat ada pending
- [ ] Tombol "Sinkron sekarang" di drawer
- [ ] Empty state "Semua tersinkron" dengan icon cloud-check

### Konflik resolution
- [ ] Sidebar badge merah counter "Konflik sync N"
- [ ] **Tombol "Trigger konflik baru"** di page `/konflik` (untuk demo/testing)
- [ ] 2 jenis kartu konflik:
  - Single-field: side-by-side radio
  - Multi-field: table per-field dropdown
- [ ] Animasi slide-out saat resolve
- [ ] Info box "Strategi default" (LWW untuk parameter, manual untuk kedalaman)

### File export (real, bukan mock)
- [ ] `/qc` tombol TXT, PNG Chart, Excel page 2/3, Request PAT CSV — **semua beneran download file** (bukan tombol mati)
- [ ] TXT: production format dengan header AOI + 8 baris (`ORDER NO`, `KANAL ID`, dst.)
- [ ] CSV: koordinat UTM (X/Y per row)
- [ ] Excel: 2 sheet (Page 2 parameter + Page 3 kedalaman) via SheetJS
- [ ] PNG: Canvas render dengan threshold lines + meta header (server-side via chartjs-node-canvas di production)

### Form validation real-time
- [ ] Border red/orange/green sesuai status valid/warning/ok
- [ ] Error message di bawah field, update live (debounced 150ms)
- [ ] Box-shadow ring color match border
- [ ] Pattern check: Order No format, Operation No default, Measure Point tanpa spasi, max 3 decimal
- [ ] Toast warning saat clamp (mis. Measure Date > Finish Date)

### Live updates
- [ ] **Live clock** di top nav (HH:MM:SS + hari + tanggal Indo), tick per detik
- [ ] **Tab badge unread**: `document.title = '(N) HydroCanal QC...'`
- [ ] **Activity feed** di dashboard: last 5 audit entries, auto-refresh 30s

### Animations & micro-interactions
- [ ] Keyframes: `slide-down`, `slide-up`, `fade`, `scale-in`, `pulse-dot`, `shimmer`
- [ ] Toast slide-up dari kanan bawah, auto-dismiss 2800ms
- [ ] Status badge dot dengan pulse animation untuk "berjalan"
- [ ] Hover lift di card (transform translateY(-1px) + shadow grow)
- [ ] Page transition: fade-in saat route change
- [ ] Confirmation modal: scale-in + backdrop fade

### Confirmation modal (kustom, bukan native)
- [ ] Helper `confirmDialog({ title, body, confirm, danger?, onConfirm })`
- [ ] Backdrop blur + click-outside-to-close
- [ ] ESC to close
- [ ] Default + danger style (red button)
- [ ] Dipakai untuk destructive actions: Reset lokal, Hapus operator, dll

### Empty / loading / error states
- [ ] EmptyState component: icon-grid + heading + sub + CTA
- [ ] Skeleton loader untuk table & card (shimmer animation)
- [ ] Error fallback dengan retry button
- [ ] Empty state di Konflik: "Setelah semua diselesaikan, list kosong"

### Print stylesheet
- [ ] `@media print`: hide nav/sidebar/drawer/toast/cmdk/bottom nav/no-print class
- [ ] Full-width content
- [ ] `.bg-white` jadi border-only (tidak ada shadow di print)
- [ ] Buttons tidak muncul

### GPS capture
- [ ] Tombol "Capture GPS" di Kedalaman form
- [ ] `navigator.geolocation.getCurrentPosition` real
- [ ] Permission denied → toast error
- [ ] Update row pertama lat/lng (atau row yang dipilih)

### CSV drag-drop import
- [ ] Drop zone visual (dashed border, hover state, dragover scale + glow)
- [ ] FileReader parse split lines
- [ ] Toast feedback + masuk antrian sync
- [ ] Support drag-drop di Kedalaman form + Undangan baru wizard

### Other touches
- [ ] **Daftar Glossary** lengkap di `/help` (AOI, STA, Measure Point, water_level, tranducer, bed_float, depth_correction, QC Type, USV, Region, PAT, Final depth, Order No, Request Date, SPK, QC Date vs Measure Date, Coordinate UTM, Vendor/Area)
- [ ] **FAQ collapsible** di `/help`
- [ ] **Quick start CTA** di `/help` sidebar untuk re-trigger tour
- [ ] **AOI header 3-card** (Region, Area, Vendor) di list & detail undangan
- [ ] **Multi-step wizard** undangan baru dengan stepper indicator + sticky ringkasan sidebar
- [ ] **Wizard sticky sidebar** dengan validasi live + CTA Buat & assign
- [ ] **Deadline countdown badge** di tabel undangan + card penugasan + detail
- [ ] **Calendar dengan klik tanggal → side panel** daftar event hari itu
- [ ] **Mini-map di penugasan detail** (Leaflet 280px height)
- [ ] **Bulk shift-select** di tabel undangan (port existing `selectRange shift+click`)

### Visual identity
- [ ] Brand color: `#0284c7` (cyan-600), gradient ke `#0ea5e9` (cyan-500)
- [ ] Font: Inter (semua text) + JetBrains Mono (code, IDs)
- [ ] Status colors: emerald (pass), amber (tolerance), rose (fail), brand (active), slate (idle)
- [ ] Border radius: `.5rem` (input/button), `.75rem` (card), `9999px` (badge)
- [ ] Shadows: `soft` (subtle), `card` (default), `pop` (modal/drawer)
- [ ] Icons: **Lucide** (sama dengan demo), import lazy untuk tree-shake

### Storage data persist (di localStorage)
- [ ] `queue` — sync queue (di production: derive dari PouchDB)
- [ ] `threshold` — singleton Pengukuran (mirror dari API untuk offline)
- [ ] `settings` — autoSync, adminOnlyEdit
- [ ] `theme` — light/dark
- [ ] `role` — admin/operator (di production: dari session)
- [ ] `tourSeen` — flag walkthrough sudah ditonton
- [ ] `depthEdits` — diff edits yang belum tersinkron (di production: di PouchDB)
- [ ] `notifications` — cache (sumber: API)

> Catatan port: di demo semua di localStorage. Di production, mostly pindah ke PouchDB / session, kecuali `theme` & `tourSeen` & `settings` UI-only yang tetap di localStorage.
