/* ============================================================
   HydroCanal QC — Operations Mockup
   Single-page app: router, state, persistence, interactions
   ============================================================ */

// ---------- Storage wrapper ----------
const STORAGE_NS = 'hydrocanal:';
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(STORAGE_NS + k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(STORAGE_NS + k, JSON.stringify(v)); } catch {} },
  del(k) { localStorage.removeItem(STORAGE_NS + k); },
};

// ---------- Demo "today" (stabil untuk countdown deadline) ----------
const DEMO_TODAY = new Date('2026-05-18T00:00:00');

// Deadline = Request Date + 4 hari (hari undangan masuk = hari ke-1, maks 5 hari)
function deadlineInfo(requestDate) {
  const req = new Date(requestDate + 'T00:00:00');
  const dl = new Date(req); dl.setDate(dl.getDate() + 4);
  const diff = Math.round((dl - DEMO_TODAY) / 86400000);
  const dlStr = dl.toISOString().slice(0, 10);
  let label, tone;
  if (diff < 0)       { label = `LEWAT ${Math.abs(diff)} hari`; tone = 'rose'; }
  else if (diff === 0){ label = 'Deadline hari ini';            tone = 'rose'; }
  else if (diff === 1){ label = 'Sisa 1 hari';                  tone = 'amber'; }
  else if (diff <= 2) { label = `Sisa ${diff} hari`;            tone = 'amber'; }
  else                { label = `Sisa ${diff} hari`;            tone = 'emerald'; }
  return { deadline: dlStr, diff, label, tone };
}

// Singkatan kontraktor untuk chart export
function shortName(name) {
  const map = {
    'PT CIPTA BUANA SAMUDRA': 'PT. CBS', 'PT PUTRA RIMBA NUSANTARA': 'PT. PRN',
    'PT MUSI NAULI LESTARI': 'PT. MNL', 'PT SUMBER HIJAU PERMAI': 'PT. SHP',
  };
  return map[name] || ('PT. ' + name.split(' ').slice(1).map(w => w[0]).join(''));
}

// ---------- Mock data ----------
const MOCK = {
  // Header AOI (dari Excel "AOI QC Canal USV Notification" — WM)
  aoi: { region: 'Palembang', area: 'SUMSEL P1', vendor: 'PT. KARTA BHUMI NUSANTARA' },

  // 1 baris per Canal ID — TIAP canal punya Order No sendiri
  undangan: [
    { orderNo: '2000349188', district: 'D.SUNGAI_BEYUKU',      requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SB180200', panjang: 1000, dimensi: '8X5X3',  measurePoint: '382955', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT CIPTA BUANA SAMUDRA',   coordX: 540840, coordY: 9674337, status: 'Assigned',    assignedTo: 'Fathul A.', usv: 'KBN01' },
    { orderNo: '2000349189', district: 'D.SUNGAI_BEYUKU',      requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SB180202', panjang: 1000, dimensi: '8X5X3',  measurePoint: '382956', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT CIPTA BUANA SAMUDRA',   coordX: 540840, coordY: 9673402, status: 'In Progress', assignedTo: 'Fathul A.', usv: 'KBN01' },
    { orderNo: '2000349190', district: 'D.SUNGAI_BEYUKU',      requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SB180204', panjang: 998,  dimensi: '8X5X3',  measurePoint: '382957', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT CIPTA BUANA SAMUDRA',   coordX: 540869, coordY: 9672320, status: 'Submitted',   assignedTo: null,        usv: null },
    { orderNo: '2000348941', district: 'D.SUNGAI_PENYABUNGAN', requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SP223200', panjang: 1107, dimensi: '10X7X3', measurePoint: '382373', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 544264, coordY: 9653212, status: 'Assigned',    assignedTo: 'Fathul A.', usv: 'KBN01' },
    { orderNo: '2000348942', district: 'D.SUNGAI_PENYABUNGAN', requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SP223204', panjang: 1016, dimensi: '10X7X3', measurePoint: '382375', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 546259, coordY: 9653944, status: 'Submitted',   assignedTo: null,        usv: null },
    { orderNo: '2000348943', district: 'D.SUNGAI_PENYABUNGAN', requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SP223206', panjang: 977,  dimensi: '10X7X3', measurePoint: '382376', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 547140, coordY: 9654291, status: 'Submitted',   assignedTo: null,        usv: null },
    { orderNo: '2000348944', district: 'D.SUNGAI_PENYABUNGAN', requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SP223208', panjang: 570,  dimensi: '10X7X3', measurePoint: '382377', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 547839, coordY: 9654548, status: 'Assigned',    assignedTo: 'Fathul A.', usv: 'KBN01' },
    { orderNo: '2000349398', district: 'D.SUNGAI_PENYABUNGAN', requestDate: '2026-05-17', requestType: 'QC',    canalId: 'SPFB1400', panjang: 1009, dimensi: '8X5X3',  measurePoint: '382999', startDate: '2026-05-01', finishDate: '2026-05-31', contractor: 'PT MUSI NAULI LESTARI',   coordX: 548226, coordY: 9654589, status: 'In Progress', assignedTo: 'Fathul A.', usv: 'KBN01' },
    { orderNo: '2000349402', district: 'D.AIR_SUGIHAN',        requestDate: '2026-05-14', requestType: 'RE-QC', canalId: 'AS091200', panjang: 1200, dimensi: '10X7X3', measurePoint: '383110', startDate: '2026-05-01', finishDate: '2026-05-20', contractor: 'PT MUSI NAULI LESTARI',   coordX: 552014, coordY: 9648770, status: 'Submitted',   assignedTo: null,        usv: null },
    { orderNo: '2000349101', district: 'D.SUNGAI_BEYUKU',      requestDate: '2026-05-13', requestType: 'QC',    canalId: 'SB180188', panjang: 880,  dimensi: '8X5X3',  measurePoint: '382940', startDate: '2026-05-01', finishDate: '2026-05-17', contractor: 'PT CIPTA BUANA SAMUDRA',   coordX: 540210, coordY: 9675102, status: 'Done',       assignedTo: 'Fathul A.', usv: 'KBN01', qcOutput: '3C01-260517-KBN01-1R0Q1' },
    { orderNo: '2000348880', district: 'D.SUNGAI_PENYABUNGAN', requestDate: '2026-05-12', requestType: 'QC',    canalId: 'SP223150', panjang: 640,  dimensi: '10X7X3', measurePoint: '382360', startDate: '2026-05-01', finishDate: '2026-05-16', contractor: 'PT PUTRA RIMBA NUSANTARA', coordX: 543880, coordY: 9652990, status: 'Done',       assignedTo: 'Andi S.',   usv: 'KBN02', qcOutput: '3C05-260516-KBN02-1R0Q1' },
  ],

  // Penugasan = subset undangan yang di-assign ke operator (lihat assignedTo)
  // Render-nya di-derive dari undangan; tasks ini cuma untuk detail tambahan
  taskExtra: {
    'SB180200': { lat: -2.9432, lng: 104.7551, distance: '34 km' },
    'SB180202': { lat: -2.9501, lng: 104.7612, distance: '34 km' },
    'SP223200': { lat: -3.1245, lng: 105.0148, distance: '82 km' },
    'SP223208': { lat: -3.1410, lng: 105.0260, distance: '85 km' },
    'SPFB1400': { lat: -3.1812, lng: 105.0823, distance: '92 km' },
    'SB180188': { lat: -2.9388, lng: 104.7490, distance: '34 km' },
    'SP223150': { lat: -3.1190, lng: 105.0090, distance: '80 km' },
    'AS091200': { lat: -3.2450, lng: 105.1480, distance: '128 km' },
  },
  initialQueue: [
    { id: 'q1', kind: 'Data kedalaman', label: 'KBN01-K02 · 35 titik', size: '12 KB', when: 'baru saja' },
    { id: 'q2', kind: 'Parameter QC',   label: 'KBN01-K02 (revisi 001)', size: '2 KB',  when: '5 menit lalu' },
  ],
  notifications: [
    { id: 'n1', kind: 'undangan', icon: 'mail',           color: 'brand',   title: 'Undangan baru dari PT. Musi Nauli Lestari',  body: 'PAT-2026-0042 · 6 kanal · jadwal 15 Mei 2026', when: '15 menit lalu', read: false },
    { id: 'n2', kind: 'konflik',  icon: 'git-merge',      color: 'rose',    title: 'Konflik sync pada KBN01-K02',                  body: '2 field berbeda dengan versi server', when: '1 jam lalu', read: false },
    { id: 'n3', kind: 'sync',     icon: 'cloud-check',    color: 'emerald', title: '3C01-251114-KBN01 berhasil disinkronkan',      body: '24 kanal · 98% pass rate', when: '2 jam lalu', read: true },
    { id: 'n4', kind: 'penugasan',icon: 'clipboard-list', color: 'brand',   title: 'Penugasan baru ditugaskan ke kamu',            body: 'KBN01-K03 · 3C05 OKI Selatan · 13 Mei', when: 'kemarin', read: true },
    { id: 'n5', kind: 'threshold',icon: 'settings-2',     color: 'amber',   title: 'Threshold pengukuran diubah oleh admin',       body: 'lulus ≥ 2.5 (sebelumnya 2.4)', when: 'kemarin', read: true },
    { id: 'n6', kind: 'sync',     icon: 'cloud-check',    color: 'emerald', title: 'Backup harian berhasil',                       body: '847 dokumen · 14.2 MB', when: '2 hari lalu', read: true },
  ],
  users: [
    { id: 'u1', name: 'Fathul Akmal',        initials: 'FA', email: 'fathul@hydrocanal.id',  role: 'operator', usv: 'KBN01', status: 'aktif', kanal: 28, pass: 89, reqc: 5,  active: '2 menit lalu' },
    { id: 'u2', name: 'Andi Saputra',        initials: 'AS', email: 'andi@hydrocanal.id',    role: 'operator', usv: 'KBN02', status: 'aktif', kanal: 34, pass: 92, reqc: 3,  active: '12 menit lalu' },
    { id: 'u3', name: 'Rendi Hartono',       initials: 'RH', email: 'rendi@hydrocanal.id',   role: 'operator', usv: 'KBN03', status: 'cuti',  kanal: 8,  pass: 84, reqc: 11, active: '3 hari lalu' },
    { id: 'u4', name: 'Sari Putri',          initials: 'SP', email: 'sari@hydrocanal.id',    role: 'operator', usv: 'KBN04', status: 'aktif', kanal: 22, pass: 86, reqc: 7,  active: '1 jam lalu' },
    { id: 'u5', name: 'Budi Santoso',        initials: 'BS', email: 'budi@hydrocanal.id',    role: 'operator', usv: 'KBN05', status: 'aktif', kanal: 18, pass: 80, reqc: 9,  active: 'kemarin' },
    { id: 'u6', name: 'Manager Operasional', initials: 'MO', email: 'manager@hydrocanal.id', role: 'admin',    usv: '—',     status: 'aktif', kanal: 0,  pass: 0,  reqc: 0,  active: '5 menit lalu' },
    { id: 'u7', name: 'Super Admin',         initials: 'SA', email: 'admin@hydrocanal.id',   role: 'admin',    usv: '—',     status: 'aktif', kanal: 0,  pass: 0,  reqc: 0,  active: 'sekarang' },
  ],
  regionStats: [
    { name: 'PT. Ciptamas BS',   pass: 91, qc: 58 },
    { name: 'PT. Musi Nauli',    pass: 86, qc: 47 },
    { name: 'PT. Sumber Hijau',  pass: 83, qc: 38 },
    { name: 'PT. Lainnya',       pass: 88, qc: 20 },
  ],
  trendPassRate: [78,81,79,83,85,82,84,86,84,87,85,88,86,87,89,87,88,90,88,87,89,91,89,87,88,90,88,87,89,87],
  audit: [
    { id: 'a1',  user: 'Fathul A.',   uIcon: 'FA', uColor: 'brand',   action: 'edit',      kind: 'Drag-edit kedalaman',      target: 'KBN01-K02 · STA 720', detail: '2.710 → 2.840',     when: 'baru saja',     date: '11 Mei 14:22' },
    { id: 'a2',  user: 'Andi S.',     uIcon: 'AS', uColor: 'emerald', action: 'sync',      kind: 'Sinkronisasi',             target: '3C01-251114-KBN01',   detail: '24 dokumen',        when: '5 menit lalu',  date: '11 Mei 14:17' },
    { id: 'a3',  user: 'Manager Op.', uIcon: 'MO', uColor: 'amber',   action: 'assign',    kind: 'Assign petugas',           target: 'PAT-2026-0042',       detail: '→ Fathul A.',       when: '15 menit lalu', date: '11 Mei 14:07' },
    { id: 'a4',  user: 'Super Admin', uIcon: 'SA', uColor: 'rose',    action: 'threshold', kind: 'Ubah threshold',           target: 'Pengaturan',          detail: 'lulus 2.4 → 2.5',   when: '1 jam lalu',    date: '11 Mei 13:22' },
    { id: 'a5',  user: 'Andi S.',     uIcon: 'AS', uColor: 'emerald', action: 'edit',      kind: 'Edit parameter',           target: 'KBN01-K02',           detail: 'water_level 2.18',  when: '2 jam lalu',    date: '11 Mei 12:18' },
    { id: 'a6',  user: 'Fathul A.',   uIcon: 'FA', uColor: 'brand',   action: 'login',     kind: 'Login',                    target: 'Web',                 detail: 'KBN01',             when: '3 jam lalu',    date: '11 Mei 11:00' },
    { id: 'a7',  user: 'Manager Op.', uIcon: 'MO', uColor: 'amber',   action: 'edit',      kind: 'Buat undangan',            target: 'PAT-2026-0042',       detail: '6 kanal',           when: 'kemarin',       date: '10 Mei 14:22' },
    { id: 'a8',  user: 'Sari P.',     uIcon: 'SP', uColor: 'rose',    action: 'sync',      kind: 'Konflik diselesaikan',     target: 'KBN04-K07',           detail: 'pakai versi lokal', when: 'kemarin',       date: '10 Mei 11:48' },
    { id: 'a9',  user: 'Super Admin', uIcon: 'SA', uColor: 'rose',    action: 'edit',      kind: 'Tambah operator',          target: 'Sari Putri',          detail: 'role operator',     when: '2 hari lalu',   date: '09 Mei 09:12' },
    { id: 'a10', user: 'Budi S.',     uIcon: 'BS', uColor: 'amber',   action: 'edit',      kind: 'Drag-edit kedalaman',      target: 'KBN05-K02 · STA 320', detail: '2.450 → 2.620',     when: '2 hari lalu',   date: '09 Mei 08:48' },
    { id: 'a11', user: 'Rendi H.',    uIcon: 'RH', uColor: 'rose',    action: 'login',     kind: 'Login',                    target: 'Web',                 detail: 'KBN03',             when: '3 hari lalu',   date: '08 Mei 09:02' },
  ],
  events: { // hari → kind
    11: 'pen', 12: 'pen', 13: 'dl', 14: 'und', 15: 'und', 20: 'pen', 22: 'dl', 27: 'und'
  },
  eventDetails: { // hari → array of events
    11: [{ t: 'QC Banyuasin selesai', meta: 'KBN01 · 24 kanal pass', kind: 'pen' }],
    12: [{ t: 'QC Kanal KBN01-K01', meta: '08:00 – 16:00 · 3C01 Banyuasin', kind: 'pen' }, { t: 'QC Kanal KBN01-K02', meta: '13:00 – 17:00 · Lanjutan', kind: 'pen' }],
    13: [{ t: 'Deadline export TXT', meta: '3C05-251112 · EOD · PT. Ciptamas BS', kind: 'dl' }, { t: 'QC Kanal KBN01-K03', meta: '08:00 – 12:00 · 3C05 OKI Selatan', kind: 'pen' }],
    14: [{ t: 'Undangan PAT-2026-0041 mulai', meta: 'PT. Ciptamas BS · 4 kanal', kind: 'und' }],
    15: [{ t: 'Undangan PAT-2026-0042 mulai', meta: 'PT. MNL · 6 kanal', kind: 'und' }],
    20: [{ t: 'Review batch mingguan', meta: '10:00 · Office Palembang', kind: 'pen' }],
    22: [{ t: 'Deadline laporan bulanan', meta: 'EOD', kind: 'dl' }],
    27: [{ t: 'Undangan PAT-2026-0044', meta: 'Tentative · PT. SHP', kind: 'und' }],
  },
};

const statusBadge = {
  belum:    { c: 'bg-slate-100 text-slate-700',     d: 'bg-slate-500',                        t: 'Belum dimulai' },
  jalan:    { c: 'bg-brand-50 text-brand-700',      d: 'bg-brand-500 animate-pulse-dot',      t: 'Berjalan' },
  selesai:  { c: 'bg-emerald-50 text-emerald-700',  d: 'bg-emerald-500',                      t: 'Selesai' },
  aktif:    { c: 'bg-brand-50 text-brand-700',      d: 'bg-brand-500',                        t: 'Aktif' },
  menunggu: { c: 'bg-amber-50 text-amber-700',      d: 'bg-amber-500',                        t: 'Menunggu' },
};

// AOI status (dari Excel WM): Submitted / Assigned / In Progress / Done
const aoiStatusBadge = {
  'Submitted':   { c: 'bg-slate-100 text-slate-700',    d: 'bg-slate-500' },
  'Assigned':    { c: 'bg-amber-50 text-amber-700',     d: 'bg-amber-500' },
  'In Progress': { c: 'bg-brand-50 text-brand-700',     d: 'bg-brand-500 animate-pulse-dot' },
  'Done':        { c: 'bg-emerald-50 text-emerald-700', d: 'bg-emerald-500' },
};
const ID_MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function fmtShort(iso) { const d = new Date(iso + 'T00:00:00'); return `${d.getDate()} ${ID_MONTHS[d.getMonth()]}`; }
function rawToTaskStatus(s) { return s === 'Done' ? 'selesai' : s === 'In Progress' ? 'jalan' : 'belum'; }

// Penugasan = canal yang sudah di-assign ke operator (assignedTo terisi)
function penugasanList() {
  return MOCK.undangan.filter(u => u.assignedTo).map(u => {
    const ex = MOCK.taskExtra[u.canalId] || { lat: -3.0, lng: 104.9, distance: '—' };
    return {
      id: u.canalId, kanal: u.canalId, orderNo: u.orderNo, undanganNo: u.orderNo,
      district: u.district, contractor: u.contractor, region: shortName(u.contractor),
      sta: `0 → ${u.panjang}`, panjang: u.panjang, dimensi: u.dimensi,
      measurePoint: u.measurePoint, coordX: u.coordX, coordY: u.coordY,
      requestDate: u.requestDate, startDate: u.startDate, finishDate: u.finishDate,
      requestType: u.requestType, status: rawToTaskStatus(u.status), statusRaw: u.status,
      date: fmtShort(u.requestDate), lat: ex.lat, lng: ex.lng, distance: ex.distance,
      usv: u.usv, qcOutput: u.qcOutput || null, assignedTo: u.assignedTo,
    };
  });
}

// ---------- App state (persisted) ----------
const state = {
  queue:        store.get('queue', MOCK.initialQueue),
  threshold:    store.get('threshold', { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 }),
  settings:     store.get('settings', { autoSync: true, adminOnlyEdit: true }),
  theme:        store.get('theme', 'light'),
  role:         store.get('role', 'operator'),
  tourSeen:     store.get('tourSeen', false),
  isOnline:     true,
  selectedDay:  null,
  undanganFilter: { q: '', status: 'semua' },
  auditFilter:  { q: '', action: '' },
  depthEdits:   store.get('depthEdits', {}),
  notifications: store.get('notifications', MOCK.notifications),
  map:          null,
};

function persist() {
  store.set('queue', state.queue);
  store.set('threshold', state.threshold);
  store.set('settings', state.settings);
  store.set('theme', state.theme);
  store.set('role', state.role);
  store.set('tourSeen', state.tourSeen);
  store.set('depthEdits', state.depthEdits);
  store.set('notifications', state.notifications);
}

// ---------- Router ----------
const routes = {
  '/login':                 { tpl: 'view-login',                  chrome: false },
  '/':                      { tpl: 'view-dashboard',              after: renderDashboard },
  '/kalender':              { tpl: 'view-kalender',               after: renderCalendar },
  '/undangan':              { tpl: 'view-undangan',               after: renderUndangan },
  '/undangan/detail':       { tpl: 'view-undangan-detail',        after: renderUndanganDetail },
  '/penugasan':             { tpl: 'view-penugasan',              after: renderPenugasan },
  '/penugasan/detail':      { tpl: 'view-penugasan-detail',       after: renderPenugasanDetail },
  '/lapangan/parameter':    { tpl: 'view-lapangan-parameter' },
  '/lapangan/kedalaman':    { tpl: 'view-lapangan-kedalaman',     after: renderDepth },
  '/qc':                    { tpl: 'view-qc',                     after: renderMiniCharts },
  '/konflik':               { tpl: 'view-konflik' },
  '/peta':                  { tpl: 'view-peta',                   after: renderMap },
  '/distrik':               { tpl: 'view-distrik',                role: 'admin' },
  '/notifikasi':            { tpl: 'view-notifikasi',             after: renderNotifikasi },
  '/pengaturan':            { tpl: 'view-pengaturan',             after: renderPengaturan },
  '/users':                 { tpl: 'view-users',                  role: 'admin', after: renderUsers },
  '/reports':               { tpl: 'view-reports',                role: 'admin', after: renderReports },
  '/audit':                 { tpl: 'view-audit',                  role: 'admin', after: renderAudit },
  '/help':                  { tpl: 'view-help' },
  '/undangan/baru':         { tpl: 'view-undangan-baru',          role: 'admin' },
};

function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  let r = routes[hash] || { tpl: 'view-404' };
  // Role gating
  if (r.role === 'admin' && state.role !== 'admin') {
    r = { tpl: 'view-no-access', chrome: r.chrome };
  }
  const tpl = document.getElementById(r.tpl);
  const view = document.getElementById('view');
  view.innerHTML = '';
  if (tpl) view.appendChild(tpl.content.cloneNode(true));
  if (r.tpl === 'view-no-access') {
    const el = document.getElementById('no-access-role');
    if (el) el.textContent = state.role === 'admin' ? 'Admin' : 'Operator';
  }
  const showChrome = r.chrome !== false;
  document.getElementById('topnav').style.display = showChrome ? '' : 'none';
  const sb = document.querySelector('#layout aside');
  if (sb) sb.classList.toggle('md:hidden', !showChrome);
  document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === hash));
  document.querySelectorAll('nav.md\\:hidden a').forEach(a => { a.style.color = a.dataset.route === hash ? '#0284c7' : ''; });
  if (r.after) r.after();
  if (window.lucide) lucide.createIcons();
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', route);

// ============================================================
// VIEW RENDERERS
// ============================================================

function renderDashboard() {
  const wrap = document.getElementById('dashboard-tasks');
  if (!wrap) return;
  wrap.innerHTML = penugasanList().filter(t => t.status !== 'selesai').map(t => {
    const s = statusBadge[t.status];
    const dl = deadlineInfo(t.requestDate);
    return `<a href="#/penugasan/detail" data-task="${t.id}" class="block p-4 hover:bg-slate-50 transition flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 grid place-items-center text-brand-700 font-mono text-[10px] font-bold">${t.kanal.slice(-4)}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm truncate">${t.kanal} · <span class="text-slate-500 font-normal">${t.district}</span></div>
        <div class="text-xs text-slate-500 mt-0.5">${t.region} · ${t.panjang}m · order ${t.orderNo} · <span class="text-${dl.tone}-600 font-semibold">${dl.label}</span></div>
      </div>
      <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span>
      <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 ml-2"></i>
    </a>`;
  }).join('');
  // Click hook → set selected task
  wrap.querySelectorAll('a[data-task]').forEach(a => a.addEventListener('click', () => { state.selectedTask = a.dataset.task; }));

  // Live activity feed
  const act = document.getElementById('dashboard-activity');
  if (act) {
    const items = MOCK.audit.slice(0, 5);
    const actionIcon = { edit: 'pencil', sync: 'cloud-upload', assign: 'user-plus', threshold: 'settings-2', login: 'log-in' };
    act.innerHTML = items.map(a => `<div class="audit-row" style="grid-template-columns: 32px 1fr auto">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-${a.uColor}-500 to-${a.uColor}-700 grid place-items-center text-white text-[10px] font-bold">${a.uIcon}</div>
      <div class="min-w-0"><div class="text-sm"><b>${a.user}</b> · ${a.kind} <span class="text-slate-500">→</span> <span class="font-mono text-xs">${a.target}</span></div><div class="text-xs text-slate-500 mt-0.5">${a.detail || ''} <span class="text-slate-400">· ${a.when}</span></div></div>
      <i data-lucide="${actionIcon[a.action] || 'activity'}" class="w-4 h-4 text-slate-400"></i>
    </div>`).join('');
    lucide.createIcons();
  }
}

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const start = 4; // May 2026 starts on Friday → index from Mon=0
  const html = [];
  for (let i = 0; i < start; i++) html.push('<div></div>');
  for (let d = 1; d <= 31; d++) {
    const today = d === 11;
    const sel = state.selectedDay === d;
    const e = MOCK.events[d];
    const eDot = e === 'pen' ? 'bg-emerald-500' : e === 'dl' ? 'bg-rose-500' : 'bg-brand-500';
    html.push(`<div class="cal-cell ${today ? 'today' : ''} ${sel ? 'selected' : ''}" data-day="${d}">
      <div class="text-xs font-semibold ${today ? 'text-brand-700' : 'text-slate-700'}">${d}</div>
      ${e ? `<div class="mt-auto flex gap-0.5"><span class="w-1.5 h-1.5 rounded-full ${eDot}"></span></div>` : ''}
    </div>`);
  }
  grid.innerHTML = html.join('');
  grid.querySelectorAll('[data-day]').forEach(el => {
    el.addEventListener('click', () => { state.selectedDay = parseInt(el.dataset.day); renderCalendar(); renderDaySidebar(); });
  });
  renderDaySidebar();
}

function renderDaySidebar() {
  const wrap = document.getElementById('day-detail');
  if (!wrap) return;
  const d = state.selectedDay;
  if (!d) {
    wrap.innerHTML = `<div class="text-center text-slate-400 py-8 text-sm">
      <i data-lucide="mouse-pointer-click" class="w-7 h-7 mx-auto mb-2"></i>
      Pilih tanggal di kalender untuk melihat agenda hari itu.
    </div>`;
    lucide.createIcons();
    return;
  }
  const events = MOCK.eventDetails[d] || [];
  const dayName = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][new Date(2026, 4, d).getDay()];
  wrap.innerHTML = `<div class="flex items-baseline gap-2 mb-3">
      <div class="text-2xl font-bold">${d}</div>
      <div class="text-sm text-slate-500">${dayName}, Mei 2026</div>
    </div>
    ${events.length === 0 ? `<div class="text-sm text-slate-400 text-center py-6">Tidak ada agenda.</div>` :
      `<div class="space-y-2">${events.map(e => {
        const color = e.kind === 'pen' ? 'emerald' : e.kind === 'dl' ? 'rose' : 'brand';
        return `<div class="p-3 rounded-lg border border-slate-200 hover:border-${color}-200 hover:bg-${color}-50/40 transition cursor-pointer">
          <div class="flex items-start gap-2.5">
            <span class="badge-dot bg-${color}-500 mt-1.5"></span>
            <div class="flex-1"><div class="font-semibold text-sm">${e.t}</div><div class="text-xs text-slate-500 mt-0.5">${e.meta}</div></div>
          </div>
        </div>`;
      }).join('')}</div>`
    }`;
}

function renderUndangan() {
  const wrap = document.getElementById('undangan-rows');
  if (!wrap) return;
  const f = state.undanganFilter;
  const q = (f.q || '').toLowerCase();
  const filtered = MOCK.undangan.filter(u => {
    if (f.status !== 'semua' && u.status !== f.status) return false;
    if (q && !(u.orderNo.includes(q) || u.canalId.toLowerCase().includes(q) || u.contractor.toLowerCase().includes(q) || u.district.toLowerCase().includes(q))) return false;
    return true;
  });
  if (filtered.length === 0) {
    wrap.innerHTML = `<tr><td colspan="9" class="px-4 py-10 text-center text-slate-400">
      <i data-lucide="search-x" class="w-7 h-7 mx-auto mb-2"></i>
      <div class="text-sm">Tidak ada undangan yang cocok.</div>
    </td></tr>`;
    lucide.createIcons();
    return;
  }
  wrap.innerHTML = filtered.map(u => {
    const s = aoiStatusBadge[u.status] || aoiStatusBadge['Submitted'];
    const dl = deadlineInfo(u.requestDate);
    return `<tr class="table-row">
      <td class="px-3 py-3"><input type="checkbox" class="rounded" /></td>
      <td class="px-3 py-3"><a href="#/undangan/detail" data-order="${u.orderNo}" class="font-mono font-semibold text-slate-900 hover:text-brand-600">${u.orderNo}</a><div class="text-[11px] text-slate-400">${u.requestType}</div></td>
      <td class="px-3 py-3 font-mono font-semibold">${u.canalId}<div class="text-[11px] text-slate-400 font-sans">${u.panjang}m · ${u.dimensi}</div></td>
      <td class="px-3 py-3 text-slate-600 text-xs">${u.district}</td>
      <td class="px-3 py-3"><div class="text-sm">${u.contractor}</div><div class="text-[11px] text-slate-400">${shortName(u.contractor)}</div></td>
      <td class="px-3 py-3 text-slate-600 text-xs">${u.requestDate}</td>
      <td class="px-3 py-3"><span class="badge bg-${dl.tone}-50 text-${dl.tone}-700" title="Deadline ${dl.deadline}"><span class="badge-dot bg-${dl.tone}-500"></span>${dl.label}</span></td>
      <td class="px-3 py-3"><span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${u.status}</span></td>
      <td class="px-3 py-3"><button class="p-1.5 rounded hover:bg-slate-100"><i data-lucide="more-horizontal" class="w-4 h-4 text-slate-400"></i></button></td>
    </tr>`;
  }).join('');
  wrap.querySelectorAll('[data-order]').forEach(a => a.addEventListener('click', () => { state.selectedOrder = a.dataset.order; }));
  const total = document.getElementById('undangan-total');
  if (total) total.textContent = `${filtered.length} dari ${MOCK.undangan.length}`;
  lucide.createIcons();
}

function renderUndanganDetail() {
  const wrap = document.getElementById('undangan-detail-content');
  if (!wrap) return;
  const u = MOCK.undangan.find(x => x.orderNo === state.selectedOrder) || MOCK.undangan[0];
  const dl = deadlineInfo(u.requestDate);
  const s = aoiStatusBadge[u.status] || aoiStatusBadge['Submitted'];
  // Kanal lain dengan kontraktor + distrik sama (1 AOI batch bisa banyak canal)
  const siblings = MOCK.undangan.filter(x => x.contractor === u.contractor && x.district === u.district && x.orderNo !== u.orderNo);
  wrap.innerHTML = `
    <nav class="flex items-center gap-1.5 text-xs text-slate-500"><a href="#/undangan" class="hover:text-slate-900">Undangan</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span class="text-slate-900 font-medium font-mono">${u.orderNo}</span></nav>
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-2xl font-bold tracking-tight font-mono">${u.orderNo}</h1>
          <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${u.status}</span>
          <span class="badge bg-${dl.tone}-50 text-${dl.tone}-700"><span class="badge-dot bg-${dl.tone}-500"></span>${dl.label}</span>
        </div>
        <p class="text-sm text-slate-600 mt-1">${u.contractor} · ${u.district} · Canal <span class="font-mono">${u.canalId}</span></p>
      </div>
      <div class="flex gap-2 no-print">
        <button class="btn btn-ghost" onclick="window.print()"><i data-lucide="printer" class="w-4 h-4"></i>Cetak</button>
        <button class="btn btn-ghost" data-min-role="admin"><i data-lucide="copy" class="w-4 h-4"></i>Duplikat</button>
        <button class="btn btn-primary" data-min-role="admin"><i data-lucide="user-plus" class="w-4 h-4"></i>Assign petugas</button>
      </div>
    </header>

    <div class="grid sm:grid-cols-3 gap-3">
      <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-3"><div class="text-[11px] text-slate-500 uppercase tracking-wider">Region</div><div class="font-semibold text-sm mt-0.5">${MOCK.aoi.region}</div></div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-3"><div class="text-[11px] text-slate-500 uppercase tracking-wider">Area</div><div class="font-semibold text-sm mt-0.5">${MOCK.aoi.area}</div></div>
      <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-3"><div class="text-[11px] text-slate-500 uppercase tracking-wider">Vendor</div><div class="font-semibold text-sm mt-0.5">${MOCK.aoi.vendor}</div></div>
    </div>

    <div class="grid lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-soft">
          <div class="p-4 border-b border-slate-100 sec-title">Detail AOI / Order</div>
          <div class="p-4 grid sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div><div class="text-xs text-slate-500">Order No</div><div class="font-mono font-semibold mt-0.5">${u.orderNo}</div></div>
            <div><div class="text-xs text-slate-500">Canal ID</div><div class="font-mono font-semibold mt-0.5">${u.canalId}</div></div>
            <div><div class="text-xs text-slate-500">Request Type</div><div class="font-semibold mt-0.5">${u.requestType}</div></div>
            <div><div class="text-xs text-slate-500">District</div><div class="font-semibold mt-0.5">${u.district}</div></div>
            <div><div class="text-xs text-slate-500">Contractor</div><div class="font-semibold mt-0.5">${u.contractor} <span class="text-slate-400 font-normal">· ${shortName(u.contractor)}</span></div></div>
            <div><div class="text-xs text-slate-500">Panjang · Dimensi</div><div class="font-semibold mt-0.5">${u.panjang} m · ${u.dimensi}</div></div>
            <div><div class="text-xs text-slate-500">Measure Point</div><div class="font-mono font-semibold mt-0.5">${u.measurePoint}</div></div>
            <div><div class="text-xs text-slate-500">Coordinate X / Y (UTM)</div><div class="font-mono font-semibold mt-0.5">${u.coordX} / ${u.coordY}</div></div>
            <div><div class="text-xs text-slate-500">Status</div><div class="font-semibold mt-0.5">${u.status}</div></div>
            <div><div class="text-xs text-slate-500">Request Date</div><div class="font-semibold mt-0.5">${u.requestDate}</div></div>
            <div><div class="text-xs text-slate-500">SPK Start → Finish</div><div class="font-semibold mt-0.5">${u.startDate} → ${u.finishDate}</div></div>
            <div><div class="text-xs text-slate-500">Deadline (req+5hr)</div><div class="font-semibold mt-0.5 text-${dl.tone}-600">${dl.deadline} · ${dl.label}</div></div>
            <div><div class="text-xs text-slate-500">Operator / USV</div><div class="font-semibold mt-0.5">${u.assignedTo ? u.assignedTo + ' (' + u.usv + ')' : 'Belum di-assign'}</div></div>
            ${u.qcOutput ? `<div><div class="text-xs text-slate-500">QC Output</div><div class="font-mono font-semibold mt-0.5 text-brand-600">${u.qcOutput}</div></div>` : ''}
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-soft">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between"><div class="sec-title">Canal lain · ${u.contractor} / ${u.district}</div><span class="text-xs text-slate-500">${siblings.length} canal lain</span></div>
          ${siblings.length === 0 ? `<div class="p-4 text-sm text-slate-400">Tidak ada canal lain di kombinasi kontraktor/distrik ini.</div>` : `<div class="divide-y divide-slate-100">${siblings.map(x => {
            const xs = aoiStatusBadge[x.status] || aoiStatusBadge['Submitted'];
            return `<a href="#/undangan/detail" data-order="${x.orderNo}" class="flex items-center gap-3 p-3.5 hover:bg-slate-50">
              <div class="w-9 h-9 rounded-lg bg-slate-50 grid place-items-center text-slate-500 font-mono text-[10px] font-bold">${x.canalId.slice(-3)}</div>
              <div class="flex-1 min-w-0"><div class="font-mono font-semibold text-sm">${x.canalId} <span class="text-slate-400 font-sans font-normal">· order ${x.orderNo}</span></div><div class="text-xs text-slate-500">${x.panjang}m · ${x.dimensi} · MP ${x.measurePoint}</div></div>
              <span class="badge ${xs.c}"><span class="badge-dot ${xs.d}"></span>${x.status}</span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
            </a>`;
          }).join('')}</div>`}
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-4">
          <div class="sec-title mb-3">Acuan deadline</div>
          <div class="text-sm space-y-2">
            <div class="flex justify-between"><span class="text-slate-500">Request Date</span><span class="font-semibold">${u.requestDate}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Maks proses</span><span class="font-semibold">5 hari</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Deadline</span><span class="font-semibold text-${dl.tone}-600">${dl.deadline}</span></div>
            <div class="pt-2 border-t border-slate-100 text-xs text-slate-500">Hari undangan masuk dihitung sebagai hari ke-1. Hari ini (demo): <b>2026-05-18</b>.</div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-4">
          <div class="sec-title mb-3">Timeline</div>
          <div class="relative pl-5 space-y-3">
            <div class="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200"></div>
            <div class="relative"><span class="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span><div class="text-sm font-semibold">AOI diterima dari WM</div><div class="text-xs text-slate-500">${u.requestDate}</div></div>
            <div class="relative"><span class="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full ${u.assignedTo ? 'bg-brand-500 ring-brand-100' : 'bg-slate-300 ring-slate-100'} ring-4"></span><div class="text-sm font-semibold ${u.assignedTo ? '' : 'text-slate-500'}">Assign petugas</div><div class="text-xs text-slate-500">${u.assignedTo || '—'}</div></div>
            <div class="relative"><span class="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full ${u.qcOutput ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-300 ring-slate-100'} ring-4"></span><div class="text-sm font-semibold ${u.qcOutput ? '' : 'text-slate-500'}">QC selesai &amp; output</div><div class="text-xs text-slate-500">${u.qcOutput || '—'}</div></div>
          </div>
        </div>
      </div>
    </div>`;
  wrap.querySelectorAll('[data-order]').forEach(a => a.addEventListener('click', () => { state.selectedOrder = a.dataset.order; }));
  applyRole();
  lucide.createIcons();
}

function renderPenugasan() {
  const wrap = document.getElementById('penugasan-cards');
  if (!wrap) return;
  const tab = state.penugasanTab || 'aktif';
  // Tab buttons
  document.querySelectorAll('[data-penugasan-tab]').forEach(b => {
    const on = b.dataset.penugasanTab === tab;
    b.classList.toggle('bg-brand-50', on); b.classList.toggle('text-brand-700', on);
    b.classList.toggle('text-slate-600', !on);
  });

  let list = penugasanList();
  list = tab === 'selesai' ? list.filter(t => t.status === 'selesai') : list.filter(t => t.status !== 'selesai');

  if (list.length === 0) {
    wrap.innerHTML = `<div class="col-span-full empty-state"><div class="empty-state-icon"><i data-lucide="clipboard-check" class="w-7 h-7"></i></div><div class="font-semibold">Tidak ada penugasan ${tab}</div><div class="text-sm text-slate-500 mt-1">Cek tab lainnya atau tunggu assign dari admin.</div></div>`;
    lucide.createIcons(); return;
  }

  // Group: Kontraktor → District (jawaban WM: multi-distrik & kontraktor)
  const byContractor = {};
  list.forEach(t => { (byContractor[t.contractor] ||= []).push(t); });

  const blocks = Object.entries(byContractor).map(([contractor, items]) => {
    const totalM = items.reduce((a, b) => a + b.panjang, 0);
    const nearest = items.map(i => deadlineInfo(i.requestDate)).sort((a, b) => a.diff - b.diff)[0];
    const byDistrict = {};
    items.forEach(t => { (byDistrict[t.district] ||= []).push(t); });

    const districtBlocks = Object.entries(byDistrict).map(([district, ds]) => `
      <div class="mt-3">
        <div class="flex items-center gap-2 px-1 mb-2 text-xs font-semibold text-slate-500">
          <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>${district}
          <span class="text-slate-400 font-normal">· ${ds.length} kanal · ${ds.reduce((a,b)=>a+b.panjang,0)}m</span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${ds.map(t => {
            const s = statusBadge[t.status]; const dl = deadlineInfo(t.requestDate);
            return `<a href="#/penugasan/detail" data-task="${t.id}" class="bg-white rounded-xl border border-slate-200 shadow-soft p-4 hover:shadow-card transition block">
              <div class="flex items-center justify-between mb-2">
                <div class="font-mono font-bold">${t.kanal}</div>
                <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span>
              </div>
              <div class="space-y-1.5 text-sm">
                <div class="flex items-center gap-2 text-slate-600"><i data-lucide="hash" class="w-3.5 h-3.5"></i>Order ${t.orderNo}</div>
                <div class="flex items-center gap-2 text-slate-600"><i data-lucide="ruler" class="w-3.5 h-3.5"></i>${t.panjang}m · ${t.dimensi} · MP ${t.measurePoint}</div>
                <div class="flex items-center gap-2 text-slate-600"><i data-lucide="navigation" class="w-3.5 h-3.5"></i>${t.coordX} / ${t.coordY} · ${t.distance}</div>
                <div class="flex items-center gap-2"><i data-lucide="alarm-clock" class="w-3.5 h-3.5 text-${dl.tone}-500"></i><span class="text-${dl.tone}-600 font-semibold">${dl.label}</span> <span class="text-slate-400 text-xs">(SPK s/d ${t.finishDate})</span></div>
              </div>
              <div class="mt-3 text-xs font-semibold text-brand-600 inline-flex items-center gap-1">Lihat detail <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></div>
            </a>`;
          }).join('')}
        </div>
      </div>`).join('');

    return `<section class="bg-slate-50/60 rounded-2xl border border-slate-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white"><i data-lucide="building-2" class="w-4 h-4"></i></div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-900">${contractor}</div>
          <div class="text-xs text-slate-500">${shortName(contractor)} · ${Object.keys(byDistrict).length} distrik</div>
        </div>
        <span class="badge bg-white border border-slate-200 text-slate-700">${items.length} kanal</span>
        <span class="badge bg-white border border-slate-200 text-slate-700">${totalM.toLocaleString('id')} m</span>
        <span class="badge bg-${nearest.tone}-50 text-${nearest.tone}-700"><span class="badge-dot bg-${nearest.tone}-500"></span>${nearest.label}</span>
      </div>
      ${districtBlocks}
    </section>`;
  }).join('');

  wrap.className = 'space-y-4';
  wrap.innerHTML = `<div class="bg-brand-50 border border-brand-100 rounded-xl p-3 flex items-start gap-2.5 text-sm">
      <i data-lucide="info" class="w-4 h-4 text-brand-600 shrink-0 mt-0.5"></i>
      <div class="text-brand-900">Penugasan dikelompokkan per <b>Kontraktor → Distrik</b>. Satu operator bisa pegang beberapa kontraktor & distrik sekaligus dalam satu waktu.</div>
    </div>${blocks}`;
  wrap.querySelectorAll('[data-task]').forEach(a => a.addEventListener('click', () => { state.selectedTask = a.dataset.task; }));
  lucide.createIcons();
}

function renderPenugasanDetail() {
  const list = penugasanList();
  const t = list.find(x => x.id === state.selectedTask) || list[0];
  const wrap = document.getElementById('penugasan-detail-content');
  if (!wrap || !t) return;
  const s = statusBadge[t.status];
  const dl = deadlineInfo(t.requestDate);
  wrap.innerHTML = `
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight font-mono">${t.kanal}</h1>
          <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span>
        </div>
        <p class="text-sm text-slate-600 mt-1">${t.contractor} · ${t.district}</p>
        <p class="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1"><i data-lucide="hash" class="w-3 h-3"></i>Order No: <a href="#/undangan/detail" class="text-brand-600 font-semibold hover:underline font-mono">${t.orderNo}</a></span>
          <span class="text-slate-300">·</span><span class="inline-flex items-center gap-1"><i data-lucide="alarm-clock" class="w-3 h-3 text-${dl.tone}-500"></i><span class="text-${dl.tone}-600 font-semibold">${dl.label}</span></span>
          ${t.qcOutput ? `<span class="text-slate-300">·</span><span class="inline-flex items-center gap-1"><i data-lucide="file-text" class="w-3 h-3"></i>Output: <a href="#/qc" class="text-brand-600 font-mono font-semibold hover:underline">${t.qcOutput}</a></span>` : ''}
        </p>
      </div>
      <div class="flex gap-2 no-print">
        <button class="btn btn-ghost" onclick="window.print()"><i data-lucide="printer" class="w-4 h-4"></i>Cetak</button>
        <button class="btn btn-primary" onclick="location.hash='#/lapangan/kedalaman'"><i data-lucide="play" class="w-4 h-4"></i>Mulai QC</button>
      </div>
    </header>

    <div class="grid lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-soft">
          <div class="p-4 border-b border-slate-100 sec-title">Info pekerjaan</div>
          <div class="p-4 grid sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div><div class="text-xs text-slate-500">Canal ID</div><div class="font-mono font-semibold mt-0.5">${t.kanal}</div></div>
            <div><div class="text-xs text-slate-500">Order No</div><div class="font-mono font-semibold mt-0.5">${t.orderNo}</div></div>
            <div><div class="text-xs text-slate-500">Request Type</div><div class="font-semibold mt-0.5">${t.requestType}</div></div>
            <div><div class="text-xs text-slate-500">District</div><div class="font-semibold mt-0.5">${t.district}</div></div>
            <div><div class="text-xs text-slate-500">Kontraktor</div><div class="font-semibold mt-0.5">${shortName(t.contractor)}</div></div>
            <div><div class="text-xs text-slate-500">Panjang · Dimensi</div><div class="font-semibold mt-0.5">${t.panjang}m · ${t.dimensi}</div></div>
            <div><div class="text-xs text-slate-500">Measure Point</div><div class="font-mono font-semibold mt-0.5">${t.measurePoint}</div></div>
            <div><div class="text-xs text-slate-500">SPK Start–Finish</div><div class="font-semibold mt-0.5">${t.startDate} → ${t.finishDate}</div></div>
            <div><div class="text-xs text-slate-500">Request Date</div><div class="font-semibold mt-0.5">${t.requestDate} <span class="text-${dl.tone}-600">(${dl.label})</span></div></div>
            <div><div class="text-xs text-slate-500">Operator / USV</div><div class="font-semibold mt-0.5">${t.assignedTo} (${t.usv})</div></div>
            <div><div class="text-xs text-slate-500">Koordinat (UTM 48S)</div><div class="font-mono font-semibold mt-0.5">${t.coordX} / ${t.coordY}</div></div>
            <div><div class="text-xs text-slate-500">QC Type</div><div class="font-semibold mt-0.5">${t.requestType} · Revisi 000</div></div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-soft">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <div class="sec-title">Lokasi</div>
            <a href="#/peta" class="text-xs font-semibold text-brand-600 hover:text-brand-700">Lihat di peta besar →</a>
          </div>
          <div id="penugasan-mini-map" style="height: 280px" class="bg-slate-100"></div>
          <div class="p-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-center">
            <div><div class="text-slate-500">Latitude</div><div class="font-mono font-semibold mt-0.5">${t.lat.toFixed(4)}</div></div>
            <div><div class="text-slate-500">Longitude</div><div class="font-mono font-semibold mt-0.5">${t.lng.toFixed(4)}</div></div>
            <div><div class="text-slate-500">Jarak</div><div class="font-semibold mt-0.5 text-brand-600">${t.distance}</div></div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-4">
          <div class="sec-title mb-3">Progress</div>
          <div class="space-y-3">
            <a href="#/lapangan/parameter" class="block p-3 rounded-lg border-2 border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50">
              <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-full bg-emerald-500 grid place-items-center text-white"><i data-lucide="check" class="w-3.5 h-3.5"></i></div>
                <div class="flex-1"><div class="font-semibold text-sm">Parameter QC</div><div class="text-xs text-emerald-700">Lengkap · 11 Mei 09:12</div></div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
              </div>
            </a>
            <a href="#/lapangan/kedalaman" class="block p-3 rounded-lg border-2 border-brand-300 bg-brand-50/30 hover:bg-brand-50">
              <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-full bg-brand-500 grid place-items-center text-white"><span class="dot-pulse bg-white" style="width:8px;height:8px;"></span></div>
                <div class="flex-1"><div class="font-semibold text-sm">Data kedalaman</div><div class="text-xs text-brand-700">Sedang diproses · 28 / 35 titik</div></div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
              </div>
            </a>
            <div class="block p-3 rounded-lg border-2 border-slate-200 bg-slate-50 opacity-70">
              <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-full bg-slate-300 grid place-items-center text-white"><i data-lucide="clock" class="w-3.5 h-3.5"></i></div>
                <div class="flex-1"><div class="font-semibold text-sm">QC Processing</div><div class="text-xs text-slate-500">Menunggu data lengkap</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-soft p-4">
          <div class="sec-title mb-3">Cuaca</div>
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-200 to-sky-400 grid place-items-center text-white shadow-soft"><i data-lucide="cloud-sun" class="w-7 h-7"></i></div>
            <div class="flex-1"><div class="text-2xl font-bold">28°C</div><div class="text-xs text-slate-500">Berawan · angin 12 km/j</div></div>
          </div>
          <div class="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800 flex gap-2"><i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>Potensi hujan setelah 14:00 — siapkan terpal.</div>
        </div>
      </div>
    </div>`;
  lucide.createIcons();
  // Render mini map
  setTimeout(() => {
    if (window.L) {
      const map = L.map('penugasan-mini-map', { zoomControl: false, attributionControl: false }).setView([t.lat, t.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ className: '', html: `<div class="map-pin task"><span>${t.id.slice(-3)}</span></div>`, iconSize: [28, 36], iconAnchor: [14, 36] });
      L.marker([t.lat, t.lng], { icon }).addTo(map).bindPopup(`<b>${t.kanal}</b><br/>${t.district}`);
    }
  }, 100);
}

function renderDepth() {
  const rows = document.getElementById('depth-rows');
  if (!rows) return;
  const data = [];
  let depth = 2.6;
  for (let i = 0; i < 35; i++) {
    depth += (Math.random() - 0.5) * 0.4;
    depth = Math.max(1.4, Math.min(3.4, depth));
    const sta = 500 + i * 20;
    const stored = state.depthEdits[`KBN01-K02:${sta}`];
    const finalDepth = stored != null ? stored : depth;
    const t = state.threshold;
    let status = finalDepth >= t.lulus ? 'pass' : finalDepth >= t.tidakLulus ? 'tol' : 'fail';
    data.push({ i: i + 1, sta, lat: '-2.943' + (i % 9), lng: '104.755' + (i % 9), depth: parseFloat(finalDepth).toFixed(3), date: '2026-05-11', status });
  }
  const sColor = { pass: 'emerald', tol: 'amber', fail: 'rose' };
  rows.innerHTML = data.map(d => `<tr class="table-row" data-sta="${d.sta}">
    <td class="px-4 py-1.5 text-slate-400 font-mono text-xs">${d.i}</td>
    <td class="px-4 py-1.5 font-mono">${d.sta}</td>
    <td class="px-4 py-1.5 font-mono text-xs text-slate-600">${d.lat}</td>
    <td class="px-4 py-1.5 font-mono text-xs text-slate-600">${d.lng}</td>
    <td class="px-4 py-1.5"><input class="input input-sm w-20 font-mono" value="${d.depth}" /></td>
    <td class="px-4 py-1.5 text-xs text-slate-500">${d.date}</td>
    <td class="px-4 py-1.5"><span class="badge bg-${sColor[d.status]}-50 text-${sColor[d.status]}-700"><span class="badge-dot bg-${sColor[d.status]}-500"></span>${d.status}</span></td>
  </tr>`).join('');

  // Chart.js draggable
  const canvas = document.getElementById('depth-chart-real');
  if (canvas && window.Chart) {
    if (window._depthChart) { try { window._depthChart.destroy(); } catch (e) {} }
    const labels = data.map(d => String(d.sta));
    const values = data.map(d => -parseFloat(d.depth));
    const t = state.threshold;
    const bgColors = data.map(d => d.status === 'pass' ? '#10b981' : d.status === 'tol' ? '#f59e0b' : '#ef4444');

    window._depthChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: bgColors, borderRadius: 2, barPercentage: 0.85, categoryPercentage: 0.95 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: { top: 4, right: 4, bottom: 0, left: 0 } },
        plugins: {
          legend: { display: false },
          tooltip: { displayColors: false, callbacks: {
            title: (ctx) => 'STA ' + ctx[0].label,
            label: (ctx) => 'Final depth: ' + Math.abs(ctx.parsed.y).toFixed(3) + ' m',
          }},
          annotation: { annotations: {
            pass: { type: 'line', yMin: -t.lulus, yMax: -t.lulus, borderColor: '#10b981', borderWidth: 2, borderDash: [4,4], label: { display: true, content: `PASS ≥ ${t.lulus.toFixed(1)}`, position: 'start', backgroundColor: '#10b981', color: 'white', font: { size: 9, weight: 600 }, padding: 3 } },
            fail: { type: 'line', yMin: -t.tidakLulus, yMax: -t.tidakLulus, borderColor: '#ef4444', borderWidth: 2, borderDash: [4,4], label: { display: true, content: `FAIL < ${t.tidakLulus.toFixed(1)}`, position: 'start', backgroundColor: '#ef4444', color: 'white', font: { size: 9, weight: 600 }, padding: 3 } },
          }},
          dragData: {
            round: 3, dragX: false, showTooltip: true,
            onDragStart: () => { document.body.style.cursor = 'ns-resize'; },
            onDrag: (e, di, idx, val) => {
              const real = Math.abs(val);
              const tt = state.threshold;
              const c = real >= tt.lulus ? '#10b981' : real >= tt.tidakLulus ? '#f59e0b' : '#ef4444';
              window._depthChart.data.datasets[0].backgroundColor[idx] = c;
            },
            onDragEnd: (e, di, idx, val) => {
              document.body.style.cursor = '';
              const real = parseFloat(Math.abs(val).toFixed(3));
              const sta = parseInt(labels[idx]);
              state.depthEdits[`KBN01-K02:${sta}`] = real;
              persist();
              const tt = state.threshold;
              const status = real >= tt.lulus ? 'pass' : real >= tt.tidakLulus ? 'tol' : 'fail';
              const row = rows.querySelector(`[data-sta="${sta}"]`);
              if (row) {
                const input = row.querySelector('input');
                if (input) input.value = real.toFixed(3);
                const badge = row.querySelector('.badge');
                const sc = { pass: 'emerald', tol: 'amber', fail: 'rose' };
                if (badge) { badge.className = `badge bg-${sc[status]}-50 text-${sc[status]}-700`; badge.innerHTML = `<span class="badge-dot bg-${sc[status]}-500"></span>${status}`; }
              }
              state.queue.push({ id: 'q' + Math.random().toString(36).slice(2,8), kind: 'Drag-edit kedalaman', label: `STA ${sta} → ${real} m`, size: '1 KB', when: 'baru saja' });
              persist(); refreshConnectivityUI();
              toast('Titik di-update · masuk antrian sync', 'warn');
            },
          },
        },
        scales: {
          x: { position: 'top', ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } },
          y: { min: -3.6, max: 0, ticks: { font: { size: 9 }, callback: v => Math.abs(v).toFixed(1) }, grid: { color: 'rgba(148, 163, 184, .15)' } },
        },
      },
    });
  }

  // GPS capture button
  const gpsBtn = document.getElementById('gps-capture-btn');
  if (gpsBtn) gpsBtn.addEventListener('click', captureGPS);
  // CSV import
  const csvBtn = document.getElementById('csv-import-btn');
  const csvInput = document.getElementById('csv-import-input');
  if (csvBtn && csvInput) {
    csvBtn.addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', handleCSVImport);
  }
}

function renderMiniCharts() {
  document.querySelectorAll('[data-mini-chart]').forEach(el => {
    const seed = parseInt(el.dataset.miniChart);
    const n = 22; const w = 100 / n; const html = [];
    for (let i = 0; i < n; i++) {
      const r = Math.sin(i * (0.5 + seed * 0.2)) * 30 + 50 + (Math.random() * 15);
      const c = seed === 3 ? '#10b981' : seed === 2 ? (r > 60 ? '#10b981' : '#f59e0b') : (r > 70 ? '#10b981' : r > 40 ? '#f59e0b' : '#ef4444');
      html.push(`<div class="depth-bar" style="left:${i * w}%; width:${w * 0.85}%; height:${r}%; background:${c}; opacity:.9"></div>`);
    }
    el.innerHTML = html.join('');
  });
}

function renderMap() {
  setTimeout(() => {
    if (!window.L) return;
    if (state.map) { try { state.map.remove(); } catch {} state.map = null; }
    const map = L.map('main-map').setView([-3.0, 104.85], 10);
    state.map = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { subdomains: 'abcd', attribution: '&copy; OSM &copy; CARTO', maxZoom: 19 }).addTo(map);
    const bounds = [];
    const plist = penugasanList();
    plist.forEach(t => {
      const icon = L.divIcon({ className: '', html: `<div class="map-pin task"><span>${t.kanal.slice(-3)}</span></div>`, iconSize: [28, 36], iconAnchor: [14, 36] });
      const m = L.marker([t.lat, t.lng], { icon }).addTo(map);
      m.bindPopup(`<div style="font-family:Inter,sans-serif"><b>${t.kanal}</b> <span style="color:#0284c7">${t.distance}</span><br/>${t.district}<br/><small>${shortName(t.contractor)} · order ${t.orderNo}</small></div>`);
      bounds.push([t.lat, t.lng]);
    });
    // STA depth points sample around kanal pertama yang jalan
    const k02 = plist.find(p => p.status === 'jalan') || plist[0];
    for (let i = 0; i < 12; i++) {
      const lat = k02.lat + (Math.random() - 0.5) * 0.012;
      const lng = k02.lng + (i - 5) * 0.002;
      const status = Math.random() > .25 ? 'pass' : Math.random() > .5 ? 'tol' : 'fail';
      L.circleMarker([lat, lng], { radius: 5, color: 'white', weight: 2, fillColor: status === 'pass' ? '#10b981' : status === 'tol' ? '#f59e0b' : '#ef4444', fillOpacity: .95 }).addTo(map).bindPopup(`STA ${500 + i * 20}`);
    }
    map.fitBounds(bounds, { padding: [60, 60] });
  }, 50);
}

function renderNotifikasi() {
  const wrap = document.getElementById('notif-list');
  if (!wrap) return;
  wrap.innerHTML = state.notifications.map(n => `
    <div class="p-4 hover:bg-slate-50 transition flex gap-3 ${n.read ? '' : 'bg-brand-50/30'}" data-notif="${n.id}">
      <div class="w-10 h-10 rounded-lg bg-${n.color}-50 grid place-items-center text-${n.color}-600 shrink-0"><i data-lucide="${n.icon}" class="w-5 h-5"></i></div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="font-semibold text-sm ${n.read ? 'text-slate-700' : 'text-slate-900'}">${n.title}</div>
          ${n.read ? '' : '<span class="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5"></span>'}
        </div>
        <div class="text-xs text-slate-600 mt-0.5">${n.body}</div>
        <div class="text-[11px] text-slate-400 mt-1">${n.when}</div>
      </div>
      <button class="opacity-0 hover:opacity-100 p-1 rounded hover:bg-slate-100 transition self-start" onclick="markNotifRead('${n.id}')"><i data-lucide="check" class="w-3.5 h-3.5"></i></button>
    </div>`).join('');
  const unread = state.notifications.filter(n => !n.read).length;
  const cnt = document.getElementById('notif-unread-count');
  if (cnt) cnt.textContent = unread > 0 ? unread : '';
  const badge = document.getElementById('notif-nav-badge');
  if (badge) { badge.textContent = unread; badge.classList.toggle('hidden', unread === 0); }
  lucide.createIcons();
}

window.markNotifRead = (id) => {
  const n = state.notifications.find(x => x.id === id);
  if (n) { n.read = true; persist(); renderNotifikasi(); updateTitleBadge(); }
};

window.markAllNotifRead = () => {
  state.notifications.forEach(n => n.read = true);
  persist(); renderNotifikasi(); updateTitleBadge();
  toast('Semua ditandai dibaca', 'ok');
};

function renderPengaturan() {
  const t = state.threshold;
  const setEls = {
    lulus: document.getElementById('th-lulus'),
    tidakLulus: document.getElementById('th-tidaklulus'),
    awal: document.getElementById('th-awal'),
    akhir: document.getElementById('th-akhir'),
  };
  if (setEls.lulus)      { setEls.lulus.value = t.lulus.toFixed(3); }
  if (setEls.tidakLulus) { setEls.tidakLulus.value = t.tidakLulus.toFixed(3); }
  if (setEls.awal)       { setEls.awal.value = t.batasAwal.toFixed(3); }
  if (setEls.akhir)      { setEls.akhir.value = t.batasAkhir.toFixed(3); }

  const slider = document.getElementById('th-slider');
  if (slider) {
    slider.value = Math.round(t.lulus * 1000);
    slider.addEventListener('input', () => {
      const v = parseInt(slider.value) / 1000;
      state.threshold.lulus = v;
      state.threshold.batasAkhir = v;
      state.threshold.batasAwal = state.threshold.tidakLulus;
      persist();
      renderPengaturan();
      updateThresholdPreview();
    });
  }
  updateThresholdPreview();

  // Toggles
  document.querySelectorAll('[data-toggle-setting]').forEach(el => {
    const key = el.dataset.toggleSetting;
    el.classList.toggle('on', !!state.settings[key]);
    el.onclick = () => { state.settings[key] = !state.settings[key]; persist(); renderPengaturan(); toast('Pengaturan disimpan', 'ok'); };
  });

  // Reset local
  const resetBtn = document.getElementById('reset-local-btn');
  if (resetBtn) resetBtn.onclick = () => {
    confirmDialog({
      title: 'Hapus semua data lokal?',
      body: 'Semua draft, threshold, queue, dan edit lokal akan hilang. Tidak bisa di-undo.',
      confirm: 'Ya, hapus',
      danger: true,
      onConfirm: () => {
        Object.keys(localStorage).filter(k => k.startsWith(STORAGE_NS)).forEach(k => localStorage.removeItem(k));
        location.reload();
      },
    });
  };
}

function updateThresholdPreview() {
  const preview = document.getElementById('threshold-preview');
  if (!preview) return;
  const t = state.threshold;
  preview.innerHTML = `<span class="font-mono text-emerald-600 font-semibold">PASS ≥ ${t.lulus.toFixed(2)}</span> · <span class="font-mono text-amber-600 font-semibold">${t.batasAwal.toFixed(2)} ≤ TOL &lt; ${t.batasAkhir.toFixed(2)}</span> · <span class="font-mono text-rose-600 font-semibold">NOT PASS &lt; ${t.tidakLulus.toFixed(2)}</span>`;
}

// ============================================================
// CONNECTIVITY + SYNC
// ============================================================
function refreshConnectivityUI() {
  const banner = document.getElementById('offline-banner');
  const icon   = document.getElementById('conn-icon');
  const label  = document.getElementById('conn-label');
  banner.classList.toggle('hidden', state.isOnline);
  if (state.isOnline) { icon.setAttribute('data-lucide', 'wifi'); label.textContent = 'Online'; }
  else { icon.setAttribute('data-lucide', 'wifi-off'); label.textContent = 'Offline'; }
  document.getElementById('queue-count').textContent = state.queue.length;
  const qb = document.getElementById('queue-badge');
  qb.textContent = state.queue.length;
  qb.classList.toggle('hidden', state.queue.length === 0);
  renderSyncList();
  lucide.createIcons();
}

function renderSyncList() {
  const wrap = document.getElementById('sync-list');
  if (!wrap) return;
  if (state.queue.length === 0) {
    wrap.innerHTML = `<div class="text-center py-10 text-slate-400">
      <i data-lucide="cloud-check" class="w-10 h-10 mx-auto mb-2 text-emerald-400"></i>
      <div class="text-sm font-medium text-slate-600">Semua tersinkron</div>
      <div class="text-xs">Tidak ada perubahan tertunda</div>
    </div>`;
  } else {
    wrap.innerHTML = state.queue.map(q => `<div class="p-3 rounded-lg border border-slate-200 flex items-start gap-3">
      <div class="w-9 h-9 rounded-lg bg-amber-50 grid place-items-center text-amber-600 shrink-0"><i data-lucide="clock" class="w-4 h-4"></i></div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold">${q.kind}</div>
        <div class="text-xs text-slate-500 truncate">${q.label}</div>
        <div class="text-[10px] text-slate-400 mt-0.5">${q.size} · ${q.when}</div>
      </div>
      <button class="text-xs text-slate-500 hover:text-rose-600" onclick="dropQueue('${q.id}')"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>`).join('');
  }
  lucide.createIcons();
}

window.dropQueue = (id) => { state.queue = state.queue.filter(q => q.id !== id); persist(); refreshConnectivityUI(); };

window.forceSyncAll = () => {
  if (!state.isOnline) { toast('Tidak bisa sinkron — perangkat offline.', 'warn'); return; }
  if (state.queue.length === 0) { toast('Sudah tersinkron.', 'ok'); return; }
  const n = state.queue.length;
  state.queue = []; persist(); refreshConnectivityUI();
  toast(`${n} item berhasil disinkronkan.`, 'ok'); closeDrawer();
};

window.saveOffline = (label) => {
  state.queue.push({ id: 'q' + Math.random().toString(36).slice(2, 8), kind: 'Form', label, size: '4 KB', when: 'baru saja' });
  persist(); refreshConnectivityUI();
  toast(state.isOnline ? 'Tersimpan & dikirim ke server.' : 'Tersimpan offline · masuk antrian.', state.isOnline ? 'ok' : 'warn');
};

window.submitUndangan = () => {
  toast('Undangan PAT-2026-0043 dibuat & di-assign ke Fathul A.', 'ok');
  setTimeout(() => { location.hash = '#/undangan'; }, 700);
};

window.resolveConflict = (id) => {
  const article = event.target.closest('article');
  if (article) {
    article.style.transition = 'opacity 200ms, transform 200ms';
    article.style.opacity = '0';
    article.style.transform = 'translateX(20px)';
    setTimeout(() => article.remove(), 220);
  }
  toast('Konflik diselesaikan · perubahan disinkronkan.', 'ok');
};

// Drawer
function openDrawer() { document.getElementById('sync-drawer').classList.remove('hidden'); renderSyncList(); }
function closeDrawer() { document.getElementById('sync-drawer').classList.add('hidden'); }

// ============================================================
// TOAST
// ============================================================
function toast(msg, kind) {
  const colors = { ok: 'bg-emerald-500', warn: 'bg-amber-500', err: 'bg-rose-500' };
  const icon = { ok: 'check', warn: 'alert-triangle', err: 'x' }[kind] || 'info';
  const el = document.createElement('div');
  el.className = `${colors[kind] || 'bg-slate-900'} text-white px-4 py-2.5 rounded-lg shadow-pop flex items-center gap-2.5 text-sm font-medium animate-slide-up`;
  el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i>${msg}`;
  document.getElementById('toast-stack').appendChild(el);
  lucide.createIcons();
  setTimeout(() => { el.style.transition = 'opacity 200ms'; el.style.opacity = 0; setTimeout(() => el.remove(), 220); }, 2800);
}
window.toast = toast;

// ============================================================
// COMMAND PALETTE (⌘K)
// ============================================================
const CMD_ITEMS = [
  { id: 'dash',    label: 'Dashboard',                  icon: 'layout-dashboard', go: '#/' },
  { id: 'cal',     label: 'Kalender',                   icon: 'calendar-days',    go: '#/kalender' },
  { id: 'und',     label: 'Undangan QC',                icon: 'mail',             go: '#/undangan' },
  { id: 'undb',    label: 'Buat undangan baru',         icon: 'plus-circle',      go: '#/undangan/baru' },
  { id: 'pen',     label: 'Penugasan saya',             icon: 'clipboard-list',   go: '#/penugasan' },
  { id: 'param',   label: 'Input parameter QC',         icon: 'form-input',       go: '#/lapangan/parameter' },
  { id: 'depth',   label: 'Input kedalaman',            icon: 'ruler',            go: '#/lapangan/kedalaman' },
  { id: 'qc',      label: 'QC Processing',              icon: 'line-chart',       go: '#/qc' },
  { id: 'peta',    label: 'Peta penugasan',             icon: 'map',              go: '#/peta' },
  { id: 'konflik', label: 'Konflik sync',               icon: 'git-merge',        go: '#/konflik' },
  { id: 'distrik', label: 'Distrik & Region',           icon: 'map-pinned',       go: '#/distrik' },
  { id: 'notif',   label: 'Notifikasi',                 icon: 'bell',             go: '#/notifikasi' },
  { id: 'set',     label: 'Pengaturan',                 icon: 'settings',         go: '#/pengaturan' },
  { id: 'usr',     label: 'Operator & akun (admin)',    icon: 'users',            go: '#/users' },
  { id: 'rep',     label: 'Reports & Analytics (admin)',icon: 'bar-chart-3',      go: '#/reports' },
  { id: 'aud',     label: 'Audit log (admin)',          icon: 'scroll-text',      go: '#/audit' },
  { id: 'role',    label: 'Ganti role (admin/operator)',icon: 'shield-check',     action: () => toggleRole() },
  { id: 'help',    label: 'Bantuan & shortcuts',        icon: 'circle-help',      go: '#/help' },
  { id: 'tour',    label: 'Mulai walkthrough tour',     icon: 'presentation',     action: () => startTour() },
  { id: 'tconf',   label: 'Trigger konflik sync (demo)',icon: 'zap',              action: () => { location.hash = '#/konflik'; setTimeout(triggerConflict, 200); } },
  { id: 'theme',   label: 'Toggle dark mode',           icon: 'sun-moon',         action: () => toggleTheme() },
  { id: 'conn',    label: 'Toggle offline/online',      icon: 'wifi-off',         action: () => toggleConnectivity() },
  { id: 'sync',    label: 'Sinkron sekarang',           icon: 'refresh-cw',       action: () => forceSyncAll() },
  { id: 'print',   label: 'Cetak halaman aktif',        icon: 'printer',          action: () => window.print() },
];
let cmdkFiltered = [...CMD_ITEMS], cmdkActive = 0;

function openCmdK() {
  document.getElementById('cmdk').classList.remove('hidden');
  document.getElementById('cmdk-input').value = '';
  cmdkFiltered = [...CMD_ITEMS]; cmdkActive = 0; renderCmdK();
  setTimeout(() => document.getElementById('cmdk-input').focus(), 30);
}
function closeCmdK() { document.getElementById('cmdk').classList.add('hidden'); }
function renderCmdK() {
  const list = document.getElementById('cmdk-list');
  if (cmdkFiltered.length === 0) {
    list.innerHTML = `<div class="text-center py-6 text-slate-400 text-sm">Tidak ada hasil.</div>`;
    return;
  }
  list.innerHTML = cmdkFiltered.map((it, i) => `<div class="cmdk-item ${i === cmdkActive ? 'active' : ''}" data-i="${i}">
    <i data-lucide="${it.icon}" class="w-4 h-4"></i>
    <span class="flex-1">${it.label}</span>
    ${it.go ? `<span class="cmdk-kbd">↵</span>` : ''}
  </div>`).join('');
  lucide.createIcons();
  list.querySelectorAll('[data-i]').forEach(el => {
    el.addEventListener('mouseenter', () => { cmdkActive = parseInt(el.dataset.i); renderCmdK(); });
    el.addEventListener('click', () => executeCmdK(cmdkFiltered[parseInt(el.dataset.i)]));
  });
}
function filterCmdK(q) {
  const ql = q.toLowerCase().trim();
  cmdkFiltered = ql ? CMD_ITEMS.filter(it => it.label.toLowerCase().includes(ql)) : [...CMD_ITEMS];
  cmdkActive = 0; renderCmdK();
}
function executeCmdK(item) {
  if (!item) return;
  closeCmdK();
  if (item.go) location.hash = item.go;
  else if (item.action) item.action();
}

// ============================================================
// THEME
// ============================================================
function applyTheme() {
  document.body.classList.toggle('dark', state.theme === 'dark');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    const icon = btn.querySelector('[data-lucide]');
    if (icon) icon.setAttribute('data-lucide', state.theme === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
  }
}
function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; persist(); applyTheme(); }

// ============================================================
// GPS
// ============================================================
function captureGPS() {
  if (!navigator.geolocation) { toast('Browser tidak mendukung GPS.', 'err'); return; }
  toast('Mengambil koordinat…', 'ok');
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      toast(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`, 'ok');
      // Update first input lat/lng in depth-rows for demo
      const firstRow = document.querySelector('#depth-rows tr');
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        if (cells[2]) cells[2].textContent = latitude.toFixed(5);
        if (cells[3]) cells[3].textContent = longitude.toFixed(5);
      }
    },
    err => toast('Gagal ambil GPS: ' + err.message, 'err'),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ============================================================
// CSV IMPORT
// ============================================================
function handleCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const text = ev.target.result;
    const lines = text.split(/\r?\n/).filter(Boolean);
    toast(`Import ${file.name} · ${lines.length} baris terbaca (demo).`, 'ok');
    state.queue.push({ id: 'q' + Math.random().toString(36).slice(2,8), kind: 'Import CSV', label: `${file.name} · ${lines.length} baris`, size: Math.round(file.size / 1024) + ' KB', when: 'baru saja' });
    persist(); refreshConnectivityUI();
  };
  reader.readAsText(file);
}

// Drag-drop for whole drop zones
function attachDropZones() {
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        toast(`File ${file.name} di-import (demo).`, 'ok');
        state.queue.push({ id: 'q' + Math.random().toString(36).slice(2,8), kind: 'Import', label: file.name, size: Math.round(file.size / 1024) + ' KB', when: 'baru saja' });
        persist(); refreshConnectivityUI();
      }
    });
  });
}

// ============================================================
// ROLE HIERARCHY
// ============================================================
function applyRole() {
  document.body.classList.toggle('role-admin',    state.role === 'admin');
  document.body.classList.toggle('role-operator', state.role === 'operator');
  const sw = document.getElementById('role-switcher');
  const lbl = document.getElementById('role-label');
  const sub = document.getElementById('role-sub');
  if (sw) {
    sw.classList.remove('admin', 'operator');
    sw.classList.add(state.role);
    const icon = sw.querySelector('.role-icon i');
    if (icon) icon.setAttribute('data-lucide', state.role === 'admin' ? 'shield-check' : 'user');
  }
  if (lbl) lbl.textContent = state.role === 'admin' ? 'Admin' : 'Operator';
  if (sub) sub.textContent = state.role === 'admin' ? 'Manager · semua akses' : 'KBN01 · Fathul';
  // Apply lock overlay on admin-only fields when in operator
  document.querySelectorAll('[data-lock="admin"]').forEach(el => {
    el.classList.toggle('lock-overlay', state.role !== 'admin');
  });
  lucide.createIcons();
}

window.setRole = (r) => {
  if (state.role === r) return;
  state.role = r; persist(); applyRole();
  toast(`Role diganti → ${r === 'admin' ? 'Admin' : 'Operator'}`, 'ok');
  // Re-route in case current page is now restricted
  route();
};

function toggleRole() { setRole(state.role === 'admin' ? 'operator' : 'admin'); }

// ============================================================
// USERS PAGE
// ============================================================
function renderUsers() {
  const wrap = document.getElementById('users-rows');
  if (!wrap) return;
  wrap.innerHTML = MOCK.users.map(u => {
    const roleColor = u.role === 'admin' ? 'amber' : 'brand';
    const stColor   = u.status === 'aktif' ? 'emerald' : 'slate';
    return `<tr class="table-row">
      <td class="px-4 py-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-${roleColor}-500 to-${roleColor}-700 grid place-items-center text-white text-xs font-bold">${u.initials}</div>
          <div><div class="font-semibold">${u.name}</div><div class="text-xs text-slate-500">${u.email}</div></div>
        </div>
      </td>
      <td class="px-4 py-3"><span class="badge bg-${roleColor}-50 text-${roleColor}-700"><i data-lucide="${u.role === 'admin' ? 'shield-check' : 'user'}" class="w-3 h-3"></i>${u.role}</span></td>
      <td class="px-4 py-3 font-mono text-xs">${u.usv}</td>
      <td class="px-4 py-3"><span class="badge bg-${stColor}-50 text-${stColor}-700"><span class="badge-dot bg-${stColor}-500"></span>${u.status}</span></td>
      <td class="px-4 py-3">${u.kanal > 0 ? `<div class="flex items-center gap-2"><div class="font-semibold">${u.kanal}</div><div class="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-emerald-500" style="width:${u.pass}%"></div></div><div class="text-xs text-emerald-700 font-semibold">${u.pass}%</div></div>` : '<span class="text-slate-300">—</span>'}</td>
      <td class="px-4 py-3 text-xs text-slate-500">${u.active}</td>
      <td class="px-4 py-3"><button class="p-1.5 rounded hover:bg-slate-100"><i data-lucide="more-horizontal" class="w-4 h-4 text-slate-400"></i></button></td>
    </tr>`;
  }).join('');
  lucide.createIcons();
}

// ============================================================
// REPORTS PAGE
// ============================================================
function renderReports() {
  // Trend line
  setTimeout(() => {
    if (!window.Chart) return;
    if (window._reportTrend) { try { window._reportTrend.destroy(); } catch {} }
    if (window._reportRegion) { try { window._reportRegion.destroy(); } catch {} }
    if (window._reportDonut) { try { window._reportDonut.destroy(); } catch {} }

    const trendCanvas = document.getElementById('report-trend');
    if (trendCanvas) {
      const labels = MOCK.trendPassRate.map((_, i) => i % 5 === 0 ? `H-${30 - i}` : '');
      window._reportTrend = new Chart(trendCanvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{
          data: MOCK.trendPassRate, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.12)', fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2.5,
        }]},
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ displayColors:false, callbacks:{ label: ctx => `${ctx.parsed.y}% pass` } } },
          scales:{ x:{ ticks:{ font:{size:10}}, grid:{display:false}}, y:{ min:70, max:100, ticks:{ font:{size:10}, callback: v=>v+'%' }, grid:{ color:'rgba(148,163,184,.15)'}}} }
      });
    }

    const regionCanvas = document.getElementById('report-region');
    if (regionCanvas) {
      window._reportRegion = new Chart(regionCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels: MOCK.regionStats.map(r=>r.name.replace('PT. ','')),
          datasets: [{ data: MOCK.regionStats.map(r=>r.pass),
            backgroundColor: MOCK.regionStats.map(r => r.pass >= 90 ? '#10b981' : r.pass >= 85 ? '#0ea5e9' : '#f59e0b'),
            borderRadius: 6, barPercentage: 0.7, categoryPercentage: 0.8 }]
        },
        options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false}, tooltip:{ displayColors:false, callbacks:{ label: ctx => `${ctx.parsed.x}% (${MOCK.regionStats[ctx.dataIndex].qc} QC)` } } },
          scales:{ x:{ min:70, max:100, ticks:{ font:{size:10}, callback: v=>v+'%' }, grid:{ color:'rgba(148,163,184,.15)' }}, y:{ ticks:{ font:{size:11}}, grid:{ display:false }} } }
      });
    }

    const donutCanvas = document.getElementById('report-donut');
    if (donutCanvas) {
      window._reportDonut = new Chart(donutCanvas.getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['Pass', 'Tolerance', 'Fail'], datasets: [{ data: [142, 17, 4], backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 0, hoverOffset: 6 }] },
        options: { responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{display:false}, tooltip:{ displayColors:false } } }
      });
    }
  }, 50);

  // Operator productivity rows
  const opsWrap = document.getElementById('report-ops');
  if (opsWrap) {
    const operators = MOCK.users.filter(u => u.role === 'operator');
    opsWrap.innerHTML = operators.map(u => `<tr class="table-row">
      <td class="px-4 py-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-[10px] font-bold">${u.initials}</div><div class="font-semibold text-sm">${u.name}</div></div></td>
      <td class="px-4 py-3 font-mono text-xs">${u.usv}</td>
      <td class="px-4 py-3 font-semibold">${u.kanal}</td>
      <td class="px-4 py-3"><span class="badge bg-emerald-50 text-emerald-700">${u.pass}%</span></td>
      <td class="px-4 py-3"><span class="badge bg-amber-50 text-amber-700">${u.reqc}%</span></td>
      <td class="px-4 py-3 w-32"><div class="h-1.5 bg-slate-100 rounded-full overflow-hidden flex"><div class="h-full bg-emerald-500" style="width:${u.pass}%"></div><div class="h-full bg-amber-500" style="width:${u.reqc}%"></div></div></td>
    </tr>`).join('');
    lucide.createIcons();
  }
}

// ============================================================
// AUDIT LOG PAGE
// ============================================================
function renderAudit() {
  const wrap = document.getElementById('audit-list');
  if (!wrap) return;
  const f = state.auditFilter;
  const q = (f.q || '').toLowerCase();
  const items = MOCK.audit.filter(a => {
    if (f.action && a.action !== f.action) return false;
    if (q && !(a.user.toLowerCase().includes(q) || a.kind.toLowerCase().includes(q) || a.target.toLowerCase().includes(q) || (a.detail || '').toLowerCase().includes(q))) return false;
    return true;
  });
  if (items.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i data-lucide="search-x" class="w-7 h-7"></i></div><div class="font-semibold">Tidak ada log yang cocok</div><div class="text-sm text-slate-500 mt-1">Coba ubah filter atau kata kunci.</div></div>`;
  } else {
    const actionIcon = { edit: 'pencil', sync: 'cloud-upload', assign: 'user-plus', threshold: 'settings-2', login: 'log-in' };
    const actionColor = { edit: 'brand', sync: 'emerald', assign: 'amber', threshold: 'rose', login: 'slate' };
    wrap.innerHTML = items.map(a => {
      const ic = actionIcon[a.action] || 'activity';
      const ac = actionColor[a.action] || 'slate';
      return `<div class="audit-row" data-audit="${a.id}">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-${a.uColor}-500 to-${a.uColor}-700 grid place-items-center text-white text-[10px] font-bold">${a.uIcon}</div>
        <div class="text-xs text-slate-500 font-mono">${a.date}</div>
        <div class="min-w-0">
          <div class="text-sm"><b>${a.user}</b> <span class="text-slate-500">·</span> ${a.kind} <span class="text-slate-500">→</span> <span class="font-mono text-xs">${a.target}</span></div>
          <div class="text-xs text-slate-500 mt-0.5">${a.detail || ''}</div>
        </div>
        <span class="badge bg-${ac}-50 text-${ac}-700"><i data-lucide="${ic}" class="w-3 h-3"></i>${a.action}</span>
      </div>`;
    }).join('');
  }
  const totalEl = document.getElementById('audit-total');
  if (totalEl) totalEl.textContent = `${items.length} / ${MOCK.audit.length}`;
  lucide.createIcons();
}

// ============================================================
// CONFIRMATION MODAL
// ============================================================
window.confirmDialog = ({ title, body, confirm = 'Lanjut', danger = false, onConfirm }) => {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay" id="modal-overlay">
    <div class="modal-card">
      <div class="p-5 pb-3">
        <div class="font-bold text-lg">${title}</div>
        <div class="text-sm text-slate-600 mt-1.5">${body}</div>
      </div>
      <div class="p-3 border-t border-slate-100 flex gap-2 justify-end">
        <button class="btn btn-ghost" data-modal-close>Batal</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${confirm}</button>
      </div>
    </div>
  </div>`;
  lucide.createIcons();
  const close = () => { root.innerHTML = ''; };
  document.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', close));
  document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') close(); });
  document.getElementById('modal-confirm-btn').addEventListener('click', () => { close(); if (onConfirm) onConfirm(); });
};

// ============================================================
// WALKTHROUGH TOUR
// ============================================================
const TOUR_STEPS = [
  { sel: '#topnav a[href="#/"]',          title: 'Dashboard',         body: 'Mulai dari sini. Stat overview, penugasan minggu ini, dan status QC terbaru.',  go: '#/' },
  { sel: '#cmdk-btn',                     title: 'Command palette ⌘K', body: 'Tekan ⌘K (atau Ctrl+K) buat jump cepat antar halaman dan jalanin perintah.' },
  { sel: '#role-switcher',                title: 'Role hierarchy',    body: 'Klik untuk ganti Admin ↔ Operator. Nav links & permission akan menyesuaikan otomatis.' },
  { sel: 'a[href="#/penugasan"]',         title: 'Penugasan saya',    body: 'Operator lihat assignment-nya di sini. Klik kartu untuk masuk ke detail + lokasi peta.', go: '#/penugasan' },
  { sel: 'a[href="#/lapangan/kedalaman"]',title: 'Drag chart kedalaman', body: 'Di form input kedalaman, seret bar chart untuk koreksi titik — masuk antrian sync.', go: '#/lapangan/kedalaman' },
  { sel: '#connectivity-toggle',          title: 'Offline simulator', body: 'Klik untuk simulasi sinyal hilang. Form tetap jalan, perubahan masuk antrian.', },
  { sel: '#sync-drawer-btn',              title: 'Antrian sync',      body: 'Semua perubahan offline ada di sini. Akan otomatis terkirim saat online.' },
  { sel: 'a[href="#/peta"]',              title: 'Peta penugasan',    body: 'Map view dengan pin per kanal & sample STA color-coded sesuai threshold.', go: '#/peta' },
];
let tourIdx = 0;

function startTour() {
  tourIdx = 0;
  state.tourSeen = true; persist();
  document.getElementById('tour').classList.remove('hidden');
  document.getElementById('tour-step-total').textContent = TOUR_STEPS.length;
  showTourStep();
}

function endTour() {
  document.getElementById('tour').classList.add('hidden');
}

function showTourStep() {
  const step = TOUR_STEPS[tourIdx];
  if (!step) { endTour(); return; }
  document.getElementById('tour-step-num').textContent = tourIdx + 1;
  document.getElementById('tour-title').textContent = step.title;
  document.getElementById('tour-body').textContent = step.body;
  const dots = document.getElementById('tour-dots');
  dots.innerHTML = TOUR_STEPS.map((_, i) => `<span class="tour-dot ${i === tourIdx ? 'active' : ''}"></span>`).join('');
  document.getElementById('tour-prev').disabled = tourIdx === 0;
  document.getElementById('tour-prev').style.opacity = tourIdx === 0 ? '.4' : '1';
  document.getElementById('tour-next').innerHTML = tourIdx === TOUR_STEPS.length - 1
    ? 'Selesai <i data-lucide="check" class="w-3 h-3"></i>'
    : 'Lanjut <i data-lucide="arrow-right" class="w-3 h-3"></i>';
  lucide.createIcons();

  if (step.go && location.hash !== step.go) location.hash = step.go;

  setTimeout(() => {
    const target = document.querySelector(step.sel);
    const spot = document.getElementById('tour-spotlight');
    const card = document.getElementById('tour-card');
    if (!target) { spot.style.opacity = '0'; card.style.left = '50%'; card.style.top = '40%'; card.style.transform = 'translate(-50%,-50%)'; return; }
    spot.style.opacity = '1';
    const r = target.getBoundingClientRect();
    const pad = 8;
    spot.style.left   = (r.left - pad) + 'px';
    spot.style.top    = (r.top - pad) + 'px';
    spot.style.width  = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
    const cardW = 340, cardH = 180;
    let cx = r.left + r.width / 2 - cardW / 2;
    let cy = r.bottom + 16;
    if (cy + cardH > window.innerHeight - 16) cy = r.top - cardH - 16;
    if (cx < 16) cx = 16;
    if (cx + cardW > window.innerWidth - 16) cx = window.innerWidth - cardW - 16;
    card.style.left = cx + 'px';
    card.style.top  = cy + 'px';
    card.style.transform = 'none';
  }, step.go ? 220 : 30);
}

window.endTour = endTour;

// ============================================================
// LIVE CLOCK + TITLE BADGE
// ============================================================
function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const t = document.getElementById('clock-time'); if (t) t.textContent = `${hh}:${mm}:${ss}`;
  const d = document.getElementById('clock-date'); if (d) {
    const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    d.textContent = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
  }
}

function updateTitleBadge() {
  const unread = state.notifications.filter(n => !n.read).length;
  document.title = (unread > 0 ? `(${unread}) ` : '') + 'HydroCanal QC — Operations';
}

// ============================================================
// CONFLICT SIMULATOR
// ============================================================
const CONFLICT_TEMPLATES = [
  { sta: 660, you: 2.910, them: 2.780, who: 'Andi S.', uColor: 'emerald', uIcon: 'AS' },
  { sta: 540, you: 2.430, them: 2.510, who: 'Sari P.', uColor: 'rose',    uIcon: 'SP' },
  { sta: 820, you: 3.120, them: 2.980, who: 'Budi S.', uColor: 'amber',   uIcon: 'BS' },
  { sta: 700, you: 2.650, them: 2.720, who: 'Andi S.', uColor: 'emerald', uIcon: 'AS' },
];
let conflictTriggerIdx = 0;

function triggerConflict() {
  const wrap = document.getElementById('conflict-extra');
  if (!wrap) return;
  const c = CONFLICT_TEMPLATES[conflictTriggerIdx % CONFLICT_TEMPLATES.length];
  conflictTriggerIdx++;
  const id = 'live-' + Date.now().toString(36);
  const finalYou  = (c.you  + 2.15 + 0.45 + 0.08 - 0.02).toFixed(3);
  const finalThem = (c.them + 2.15 + 0.45 + 0.08 - 0.02).toFixed(3);
  const article = document.createElement('article');
  article.className = 'bg-white rounded-xl border-2 border-rose-300 shadow-card overflow-hidden animate-slide-up';
  article.innerHTML = `
    <div class="p-4 bg-gradient-to-r from-rose-100 to-white border-b border-rose-100 flex flex-wrap items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-rose-100 grid place-items-center text-rose-600"><i data-lucide="git-merge" class="w-5 h-5"></i></div>
      <div class="flex-1 min-w-0"><div class="font-bold font-mono">KBN01-K02 · STA ${c.sta}</div><div class="text-xs text-slate-600">Konflik baru terdeteksi · field <code class="font-mono">depth</code></div></div>
      <span class="badge bg-rose-100 text-rose-700"><span class="badge-dot bg-rose-500 animate-pulse-dot"></span>Baru</span>
      <span class="text-xs text-slate-500">baru saja</span>
    </div>
    <div class="grid md:grid-cols-2 divide-x divide-slate-100">
      <label class="p-4 cursor-pointer hover:bg-emerald-50/30 relative">
        <input type="radio" name="${id}" checked class="absolute top-4 right-4"/>
        <div class="flex items-center gap-2 mb-3"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-[10px] font-bold">FA</div><div class="text-xs"><div class="font-semibold">Versi kamu (lokal)</div><div class="text-slate-500">baru saja</div></div></div>
        <div class="rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-sm"><div class="text-slate-500 text-xs mb-1">depth</div><div class="font-bold text-emerald-600 text-lg">${c.you.toFixed(3)}</div><div class="text-slate-400 text-xs mt-2">final: <b>${finalYou}</b></div></div>
      </label>
      <label class="p-4 cursor-pointer hover:bg-emerald-50/30 relative">
        <input type="radio" name="${id}" class="absolute top-4 right-4"/>
        <div class="flex items-center gap-2 mb-3"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-${c.uColor}-500 to-${c.uColor}-700 grid place-items-center text-white text-[10px] font-bold">${c.uIcon}</div><div class="text-xs"><div class="font-semibold">Versi ${c.who} (server)</div><div class="text-slate-500">sinkron 30 detik lalu</div></div></div>
        <div class="rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-sm"><div class="text-slate-500 text-xs mb-1">depth</div><div class="font-bold text-rose-600 text-lg">${c.them.toFixed(3)}</div><div class="text-slate-400 text-xs mt-2">final: <b>${finalThem}</b></div></div>
      </label>
    </div>
    <div class="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2">
      <button class="btn btn-ghost text-xs"><i data-lucide="line-chart" class="w-3.5 h-3.5"></i>Lihat di chart</button>
      <div class="ml-auto"><button class="btn btn-primary text-xs" onclick="resolveConflict('${id}')"><i data-lucide="check" class="w-3.5 h-3.5"></i>Selesaikan</button></div>
    </div>`;
  wrap.prepend(article);
  lucide.createIcons();
  toast(`Konflik baru pada STA ${c.sta} — minta resolusi`, 'warn');
}

// ============================================================
// REAL EXPORT
// ============================================================
function downloadBlob(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function sampleDepthRows() {
  const t = state.threshold; const data = []; let d = 2.6;
  for (let i = 0; i < 35; i++) {
    d += (Math.random() - 0.5) * 0.4; d = Math.max(1.4, Math.min(3.4, d));
    const sta = 500 + i * 20;
    const stored = state.depthEdits[`KBN01-K02:${sta}`];
    const depth = stored != null ? +stored : +d.toFixed(3);
    const status = depth >= t.lulus ? 'pass' : depth >= t.tidakLulus ? 'tol' : 'fail';
    data.push({ no: i + 1, sta, lat: -2.943 + i * 0.0001, lng: 104.755 + i * 0.0001, depth, status });
  }
  return data;
}

function exportTXT() {
  const rows = sampleDepthRows();
  const header = [
    '3C01-20260515-KBN01-1R0Q1',
    'ORDER NO   : PAT-2026-0042',
    'KANAL ID   : KBN01-K02',
    'DISTRICT   : 3C01 Banyuasin',
    'OPERATOR   : Fathul A.',
    'QC DATE    : 2026-05-15',
    'QC TYPE    : Q1 (QC)',
    'REVISION   : 000',
    '',
    'STA       LAT             LON             DEPTH      STATUS',
    '------    --------------  --------------  --------   --------',
  ];
  const body = rows.map(r =>
    `${String(r.sta).padEnd(6)}    ${r.lat.toFixed(6)}      ${r.lng.toFixed(6)}      ${r.depth.toFixed(3).padStart(7)}    ${r.status.toUpperCase()}`
  );
  downloadBlob([...header, ...body, ''].join('\n'), '3C01-20260515-KBN01-1R0Q1.txt', 'text/plain');
  toast('TXT di-generate & di-download.', 'ok');
}

function exportCSV() {
  const rows = sampleDepthRows();
  const lines = [['No','STA','Easting_UTM','Northing_UTM','Depth_m','Status'].join(',')];
  rows.forEach(r => {
    // Fake UTM conversion for demo
    const easting  = (r.lng * 111000 + 200000).toFixed(2);
    const northing = (Math.abs(r.lat) * 111000).toFixed(2);
    lines.push([r.no, r.sta, easting, northing, r.depth.toFixed(3), r.status].join(','));
  });
  downloadBlob(lines.join('\n'), 'PAT-2026-0042-KBN01-K02-utm.csv', 'text/csv');
  toast('CSV (UTM) di-generate & di-download.', 'ok');
}

function exportXLSX() {
  if (!window.XLSX) { toast('SheetJS belum siap.', 'err'); return; }
  const rows = sampleDepthRows();
  // Sheet 1: parameter
  const param = [
    ['Field', 'Value'],
    ['Kanal ID', 'KBN01-K02'],
    ['Order No', 'PAT-2026-0042'],
    ['Operation No', '0010'],
    ['Water level', state.threshold.lulus ? '2.150' : '2.150'],
    ['Tranducer', '0.450'],
    ['Bed float', '0.080'],
    ['Depth correction', '0.020'],
    ['QC Date', '2026-05-15'],
    ['Operator', 'Fathul A.'],
  ];
  // Sheet 2: depth points
  const depth = [['No','STA','Latitude','Longitude','Depth (m)','Status'], ...rows.map(r => [r.no, r.sta, r.lat.toFixed(6), r.lng.toFixed(6), r.depth.toFixed(3), r.status])];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(param), 'Page 2 - Parameter');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(depth), 'Page 3 - Kedalaman');
  XLSX.writeFile(wb, 'KBN01-K02-2026-0515.xlsx');
  toast('Excel di-generate & di-download (2 sheet).', 'ok');
}

function exportPNG() {
  // Generate quick canvas snapshot of mock depth chart
  const c = document.createElement('canvas');
  c.width = 1147; c.height = 722;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  // Header
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText('KBN01-K02 · 3C01 Banyuasin', 40, 36);
  ctx.font = '12px Inter, sans-serif'; ctx.fillStyle = '#64748b';
  ctx.fillText('QC DATE: 2026-05-15 · OPERATOR: Fathul A. · PT. MNL', 40, 56);
  // Legend
  const legend = [['#10b981', `PASS ≥ ${state.threshold.lulus.toFixed(2)}`], ['#f59e0b', `${state.threshold.batasAwal.toFixed(2)} ≤ TOL < ${state.threshold.batasAkhir.toFixed(2)}`], ['#ef4444', `NOT PASS < ${state.threshold.tidakLulus.toFixed(2)}`]];
  legend.forEach(([col, txt], i) => { ctx.fillStyle = col; ctx.fillRect(40, 80 + i * 22, 18, 14); ctx.fillStyle = '#0f172a'; ctx.font = '12px Inter, sans-serif'; ctx.fillText(txt, 64, 92 + i * 22); });
  // Bars
  const rows = sampleDepthRows();
  const left = 60, right = c.width - 40, top = 170, bottom = c.height - 60;
  const w = (right - left) / rows.length;
  ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
  rows.forEach((r, i) => {
    const h = ((r.depth - 1.4) / 2) * (bottom - top);
    ctx.fillStyle = r.status === 'pass' ? '#10b981' : r.status === 'tol' ? '#f59e0b' : '#ef4444';
    ctx.fillRect(left + i * w + 1, bottom - h, Math.max(2, w - 2), h);
  });
  // Threshold lines
  const drawLine = (val, color) => {
    const y = bottom - ((val - 1.4) / 2) * (bottom - top);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
  };
  drawLine(state.threshold.lulus, '#10b981'); drawLine(state.threshold.tidakLulus, '#ef4444');
  ctx.setLineDash([]);

  c.toBlob(blob => { downloadBlob(blob, 'KBN01-K02-chart.png', 'image/png'); toast('PNG chart di-generate & di-download.', 'ok'); }, 'image/png');
}

function handleExport(kind) {
  if (kind === 'txt')  return exportTXT();
  if (kind === 'csv')  return exportCSV();
  if (kind === 'xlsx') return exportXLSX();
  if (kind === 'png')  return exportPNG();
}

// ============================================================
// FORM VALIDATION (undangan-baru)
// ============================================================
const VALIDATORS = {
  orderNo: {
    test: v => /^PAT-\d{4}-\d{4}$/.test(v.trim()),
    okMsg:  '<i data-lucide="check" class="inline w-3 h-3"></i>Format valid',
    errMsg: '<i data-lucide="alert-triangle" class="inline w-3 h-3"></i>Format harus <code>PAT-YYYY-NNNN</code>',
  },
  opNo: {
    test: v => v.trim() === '0010',
    okMsg:  '<i data-lucide="check" class="inline w-3 h-3"></i>OK · default 0010',
    errMsg: '<i data-lucide="alert-triangle" class="inline w-3 h-3"></i>Warning: bukan default 0010 — pastikan sesuai SOP',
    warnOnFail: true,
  },
};

// Measure Date clamp: jika > Finish Date AOI → set ke Finish Date
function attachParameterDateLogic() {
  const md = document.getElementById('param-measure-date');
  const fd = document.getElementById('param-finish-date');
  const msg = document.getElementById('param-measure-msg');
  if (!md || !fd || md.dataset.wired) return;
  md.dataset.wired = '1';
  const finish = fd.textContent.trim();
  const run = () => {
    if (md.value && md.value > finish) {
      md.value = finish;
      msg.innerHTML = `<span class="text-amber-600 font-semibold">⚠ Auto-clamp ke Finish Date (${finish}) — pengukuran lewat SPK.</span>`;
      toast(`Measure Date di-clamp ke Finish Date ${finish}`, 'warn');
    } else {
      msg.textContent = 'Tanggal pengukuran asli.';
    }
  };
  md.addEventListener('change', run);
}

function attachValidators() {
  document.querySelectorAll('[data-validate]').forEach(inp => {
    if (inp.dataset.validatorAttached) return;
    inp.dataset.validatorAttached = '1';
    const key = inp.dataset.validate;
    const v = VALIDATORS[key]; if (!v) return;
    const msg = document.querySelector(`[data-msg="${key}"]`);
    const run = () => {
      const ok = v.test(inp.value);
      inp.style.borderColor = ok ? '#10b981' : (v.warnOnFail ? '#f59e0b' : '#ef4444');
      inp.style.boxShadow = ok ? '0 0 0 3px rgba(16,185,129,.15)' : (v.warnOnFail ? '0 0 0 3px rgba(245,158,11,.15)' : '0 0 0 3px rgba(239,68,68,.15)');
      if (msg) {
        msg.innerHTML = ok ? v.okMsg : v.errMsg;
        msg.className = `text-[11px] mt-1 validate-msg ${ok ? 'text-emerald-600' : (v.warnOnFail ? 'text-amber-600' : 'text-rose-600')}`;
        lucide.createIcons();
      }
    };
    inp.addEventListener('input', run);
    inp.addEventListener('blur',  run);
    run();
  });
}

// ============================================================
// INIT
// ============================================================
function toggleConnectivity() {
  state.isOnline = !state.isOnline; refreshConnectivityUI();
  toast(state.isOnline ? 'Kembali online.' : 'Sekarang offline (simulasi).', state.isOnline ? 'ok' : 'warn');
}

window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Role switcher
  document.getElementById('role-switcher').addEventListener('click', toggleRole);
  applyRole();

  // Tour button
  document.getElementById('tour-btn').addEventListener('click', startTour);
  document.getElementById('tour-next').addEventListener('click', () => {
    if (tourIdx === TOUR_STEPS.length - 1) endTour(); else { tourIdx++; showTourStep(); }
  });
  document.getElementById('tour-prev').addEventListener('click', () => { if (tourIdx > 0) { tourIdx--; showTourStep(); } });

  // Audit filter
  document.addEventListener('input', e => {
    if (e.target.id === 'audit-search') { state.auditFilter.q = e.target.value; renderAudit(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'audit-action-filter') { state.auditFilter.action = e.target.value; renderAudit(); }
  });

  // Connectivity toggle
  document.getElementById('connectivity-toggle').addEventListener('click', toggleConnectivity);
  // Sync drawer
  document.getElementById('sync-drawer-btn').addEventListener('click', openDrawer);
  document.getElementById('sync-drawer').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
  // Mobile sidebar
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('hidden'); sb.classList.toggle('md:block');
  });
  // Theme
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  applyTheme();
  // Command palette
  document.getElementById('cmdk-btn').addEventListener('click', openCmdK);
  document.getElementById('cmdk-input').addEventListener('input', e => filterCmdK(e.target.value));
  document.getElementById('cmdk').addEventListener('click', e => { if (e.target.id === 'cmdk') closeCmdK(); });
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdK(); }
    else if (e.key === 'Escape') { closeCmdK(); closeDrawer(); }
    else if (!document.getElementById('cmdk').classList.contains('hidden')) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdkActive = Math.min(cmdkActive + 1, cmdkFiltered.length - 1); renderCmdK(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkActive = Math.max(cmdkActive - 1, 0); renderCmdK(); }
      else if (e.key === 'Enter') { e.preventDefault(); executeCmdK(cmdkFiltered[cmdkActive]); }
    }
  });
  // Notif nav badge initial
  const unread = state.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-nav-badge');
  if (badge) { badge.textContent = unread; badge.classList.toggle('hidden', unread === 0); }

  // Undangan filter hook (delegated)
  document.addEventListener('input', e => {
    if (e.target.id === 'undangan-search') { state.undanganFilter.q = e.target.value; renderUndangan(); }
  });
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-undangan-status]');
    if (tab) {
      state.undanganFilter.status = tab.dataset.undanganStatus;
      document.querySelectorAll('[data-undangan-status]').forEach(t => t.classList.remove('bg-white','shadow-soft','text-slate-900'));
      document.querySelectorAll('[data-undangan-status]').forEach(t => t.classList.add('text-slate-600'));
      tab.classList.add('bg-white','shadow-soft','text-slate-900');
      tab.classList.remove('text-slate-600');
      renderUndangan();
    }
    const pt = e.target.closest('[data-penugasan-tab]');
    if (pt) { state.penugasanTab = pt.dataset.penugasanTab; renderPenugasan(); }
  });

  // Drop zones + page-specific hooks (re-attach after each route)
  window.addEventListener('hashchange', () => setTimeout(() => {
    attachDropZones();
    attachValidators();
    attachParameterDateLogic();
    // Conflict trigger
    const tcb = document.getElementById('trigger-conflict-btn');
    if (tcb && !tcb.dataset.wired) { tcb.dataset.wired = '1'; tcb.addEventListener('click', triggerConflict); }
    // Export buttons
    document.querySelectorAll('[data-export]').forEach(b => {
      if (b.dataset.wired) return; b.dataset.wired = '1';
      b.addEventListener('click', () => handleExport(b.dataset.export));
    });
  }, 50));

  // Live clock
  tickClock(); setInterval(tickClock, 1000);
  // Title badge initial
  updateTitleBadge();

  refreshConnectivityUI();
  route();
  setTimeout(() => {
    attachDropZones();
    attachValidators();
    attachParameterDateLogic();
    const tcb = document.getElementById('trigger-conflict-btn');
    if (tcb && !tcb.dataset.wired) { tcb.dataset.wired = '1'; tcb.addEventListener('click', triggerConflict); }
    document.querySelectorAll('[data-export]').forEach(b => {
      if (b.dataset.wired) return; b.dataset.wired = '1';
      b.addEventListener('click', () => handleExport(b.dataset.export));
    });
  }, 50);

  // Auto-trigger tour on first visit (only on dashboard)
  if (!state.tourSeen && (location.hash === '' || location.hash === '#/')) {
    setTimeout(startTour, 600);
  }
});
