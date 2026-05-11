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

// ---------- Mock data ----------
const MOCK = {
  tasks: [
    { id: 'KBN01-K01', region: 'PT. Ciptamas BS',   district: '3C01 Banyuasin',    date: '12 Mei', status: 'belum', sta: '0 → 500',    kanal: 'KBN01-K01', lat: -2.9432, lng: 104.7551, distance: '34 km' },
    { id: 'KBN01-K02', region: 'PT. Musi Nauli',    district: '3C01 Banyuasin',    date: '12 Mei', status: 'jalan', sta: '500 → 1200', kanal: 'KBN01-K02', lat: -2.9501, lng: 104.7612, distance: '34 km' },
    { id: 'KBN01-K03', region: 'PT. Sumber Hijau',  district: '3C05 OKI Selatan',  date: '13 Mei', status: 'belum', sta: '0 → 420',    kanal: 'KBN01-K03', lat: -3.1245, lng: 105.0148, distance: '82 km' },
  ],
  undangan: [
    { no: 'PAT-2026-0042', kontraktor: 'PT. Musi Nauli Lestari',    short: 'PT. MNL', region: '3C01 Banyuasin',     sched: '15 Mei 2026', kanal: 6, status: 'menunggu' },
    { no: 'PAT-2026-0041', kontraktor: 'PT. Ciptamas Bumi Subur',   short: 'PT. CBS', region: '3C05 OKI Selatan',   sched: '14 Mei 2026', kanal: 4, status: 'aktif' },
    { no: 'PAT-2026-0040', kontraktor: 'PT. Sumber Hijau Permai',   short: 'PT. SHP', region: '3S02 Empat Lawang',  sched: '13 Mei 2026', kanal: 3, status: 'aktif' },
    { no: 'PAT-2026-0039', kontraktor: 'PT. Musi Nauli Lestari',    short: 'PT. MNL', region: '3M01 Musi Rawas',    sched: '12 Mei 2026', kanal: 8, status: 'aktif' },
    { no: 'PAT-2026-0038', kontraktor: 'PT. Ciptamas Bumi Subur',   short: 'PT. CBS', region: '3C02 Musi Banyuasin',sched: '11 Mei 2026', kanal: 5, status: 'selesai' },
    { no: 'PAT-2026-0037', kontraktor: 'PT. Sumber Hijau Permai',   short: 'PT. SHP', region: '3S01 Lahat',         sched: '10 Mei 2026', kanal: 2, status: 'selesai' },
    { no: 'PAT-2026-0036', kontraktor: 'PT. Musi Nauli Lestari',    short: 'PT. MNL', region: '3M02 PALI',          sched: '09 Mei 2026', kanal: 7, status: 'selesai' },
    { no: 'PAT-2026-0035', kontraktor: 'PT. Ciptamas Bumi Subur',   short: 'PT. CBS', region: '3C01 Banyuasin',     sched: '08 Mei 2026', kanal: 4, status: 'selesai' },
  ],
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

// ---------- App state (persisted) ----------
const state = {
  queue:        store.get('queue', MOCK.initialQueue),
  threshold:    store.get('threshold', { lulus: 2.5, tidakLulus: 2.0, batasAwal: 2.0, batasAkhir: 2.5 }),
  settings:     store.get('settings', { autoSync: true, adminOnlyEdit: true }),
  theme:        store.get('theme', 'light'),
  isOnline:     true,
  selectedDay:  null,
  undanganFilter: { q: '', status: 'semua' },
  depthEdits:   store.get('depthEdits', {}),
  notifications: store.get('notifications', MOCK.notifications),
  map:          null,
};

function persist() {
  store.set('queue', state.queue);
  store.set('threshold', state.threshold);
  store.set('settings', state.settings);
  store.set('theme', state.theme);
  store.set('depthEdits', state.depthEdits);
  store.set('notifications', state.notifications);
}

// ---------- Router ----------
const routes = {
  '/login':                 { tpl: 'view-login',                  chrome: false },
  '/':                      { tpl: 'view-dashboard',              after: renderDashboard },
  '/kalender':              { tpl: 'view-kalender',               after: renderCalendar },
  '/undangan':              { tpl: 'view-undangan',               after: renderUndangan },
  '/undangan/baru':         { tpl: 'view-undangan-baru' },
  '/undangan/detail':       { tpl: 'view-undangan-detail' },
  '/penugasan':             { tpl: 'view-penugasan',              after: renderPenugasan },
  '/penugasan/detail':      { tpl: 'view-penugasan-detail',       after: renderPenugasanDetail },
  '/lapangan/parameter':    { tpl: 'view-lapangan-parameter' },
  '/lapangan/kedalaman':    { tpl: 'view-lapangan-kedalaman',     after: renderDepth },
  '/qc':                    { tpl: 'view-qc',                     after: renderMiniCharts },
  '/konflik':               { tpl: 'view-konflik' },
  '/peta':                  { tpl: 'view-peta',                   after: renderMap },
  '/distrik':               { tpl: 'view-distrik' },
  '/notifikasi':            { tpl: 'view-notifikasi',             after: renderNotifikasi },
  '/pengaturan':            { tpl: 'view-pengaturan',             after: renderPengaturan },
};

function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const r = routes[hash] || { tpl: 'view-404' };
  const tpl = document.getElementById(r.tpl);
  const view = document.getElementById('view');
  view.innerHTML = '';
  if (tpl) view.appendChild(tpl.content.cloneNode(true));
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
  wrap.innerHTML = MOCK.tasks.map(t => {
    const s = statusBadge[t.status];
    return `<a href="#/penugasan/detail" data-task="${t.id}" class="block p-4 hover:bg-slate-50 transition flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 grid place-items-center text-brand-700 font-mono text-xs font-bold">${t.id.slice(-3)}</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm truncate">${t.kanal} · <span class="text-slate-500 font-normal">${t.district}</span></div>
        <div class="text-xs text-slate-500 mt-0.5">STA ${t.sta} · ${t.region} · ${t.date} · <i data-lucide="map-pin" class="inline w-3 h-3"></i> ${t.distance}</div>
      </div>
      <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span>
      <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 ml-2"></i>
    </a>`;
  }).join('');
  // Click hook → set selected task
  wrap.querySelectorAll('a[data-task]').forEach(a => a.addEventListener('click', () => { state.selectedTask = a.dataset.task; }));
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
  const q = f.q.toLowerCase();
  const filtered = MOCK.undangan.filter(u => {
    if (f.status !== 'semua' && u.status !== f.status) return false;
    if (q && !(u.no.toLowerCase().includes(q) || u.kontraktor.toLowerCase().includes(q) || u.region.toLowerCase().includes(q))) return false;
    return true;
  });
  if (filtered.length === 0) {
    wrap.innerHTML = `<tr><td colspan="8" class="px-4 py-10 text-center text-slate-400">
      <i data-lucide="search-x" class="w-7 h-7 mx-auto mb-2"></i>
      <div class="text-sm">Tidak ada undangan yang cocok.</div>
    </td></tr>`;
    lucide.createIcons();
    return;
  }
  wrap.innerHTML = filtered.map(u => {
    const s = statusBadge[u.status];
    return `<tr class="table-row">
      <td class="px-4 py-3"><input type="checkbox" class="rounded" /></td>
      <td class="px-4 py-3"><a href="#/undangan/detail" class="font-mono font-semibold text-slate-900 hover:text-brand-600">${u.no}</a></td>
      <td class="px-4 py-3"><div class="font-medium">${u.kontraktor}</div><div class="text-xs text-slate-500">${u.short}</div></td>
      <td class="px-4 py-3 text-slate-600">${u.region}</td>
      <td class="px-4 py-3 text-slate-600">${u.sched}</td>
      <td class="px-4 py-3"><span class="badge bg-slate-100 text-slate-700">${u.kanal} kanal</span></td>
      <td class="px-4 py-3"><span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span></td>
      <td class="px-4 py-3"><button class="p-1.5 rounded hover:bg-slate-100"><i data-lucide="more-horizontal" class="w-4 h-4 text-slate-400"></i></button></td>
    </tr>`;
  }).join('');
  const total = document.getElementById('undangan-total');
  if (total) total.textContent = `${filtered.length} dari ${MOCK.undangan.length}`;
  lucide.createIcons();
}

function renderPenugasan() {
  const wrap = document.getElementById('penugasan-cards');
  if (!wrap) return;
  wrap.innerHTML = MOCK.tasks.map(t => {
    const s = statusBadge[t.status];
    return `<a href="#/penugasan/detail" data-task="${t.id}" class="bg-white rounded-xl border border-slate-200 shadow-soft p-4 hover:shadow-card transition block">
      <div class="flex items-center justify-between mb-3">
        <div class="font-mono font-bold">${t.kanal}</div>
        <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span>
      </div>
      <div class="space-y-1.5 text-sm">
        <div class="flex items-center gap-2 text-slate-600"><i data-lucide="building-2" class="w-3.5 h-3.5"></i>${t.region}</div>
        <div class="flex items-center gap-2 text-slate-600"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i>${t.district} · ${t.distance}</div>
        <div class="flex items-center gap-2 text-slate-600"><i data-lucide="ruler" class="w-3.5 h-3.5"></i>STA ${t.sta}</div>
        <div class="flex items-center gap-2 text-slate-600"><i data-lucide="calendar" class="w-3.5 h-3.5"></i>${t.date}</div>
      </div>
      <div class="mt-4 text-xs font-semibold text-brand-600 inline-flex items-center gap-1">Lihat detail <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></div>
    </a>`;
  }).join('');
  wrap.querySelectorAll('[data-task]').forEach(a => a.addEventListener('click', () => { state.selectedTask = a.dataset.task; }));
  lucide.createIcons();
}

function renderPenugasanDetail() {
  const t = MOCK.tasks.find(x => x.id === state.selectedTask) || MOCK.tasks[1];
  const wrap = document.getElementById('penugasan-detail-content');
  if (!wrap) return;
  const s = statusBadge[t.status];
  wrap.innerHTML = `
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight font-mono">${t.kanal}</h1>
          <span class="badge ${s.c}"><span class="badge-dot ${s.d}"></span>${s.t}</span>
        </div>
        <p class="text-sm text-slate-600 mt-1">${t.region} · ${t.district}</p>
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
          <div class="p-4 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><div class="text-xs text-slate-500">ID Kanal</div><div class="font-mono font-semibold mt-0.5">${t.id}</div></div>
            <div><div class="text-xs text-slate-500">STA</div><div class="font-semibold mt-0.5">${t.sta}</div></div>
            <div><div class="text-xs text-slate-500">Jadwal</div><div class="font-semibold mt-0.5">${t.date} 2026 · 08:00 – 16:00</div></div>
            <div><div class="text-xs text-slate-500">Estimasi durasi</div><div class="font-semibold mt-0.5">~4 jam</div></div>
            <div><div class="text-xs text-slate-500">Operator</div><div class="font-semibold mt-0.5">Fathul A. (KBN01)</div></div>
            <div><div class="text-xs text-slate-500">QC Type</div><div class="font-semibold mt-0.5">QC (Q1) · Revisi 000</div></div>
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
    MOCK.tasks.forEach(t => {
      const icon = L.divIcon({ className: '', html: `<div class="map-pin task"><span>${t.id.slice(-3)}</span></div>`, iconSize: [28, 36], iconAnchor: [14, 36] });
      const m = L.marker([t.lat, t.lng], { icon }).addTo(map);
      const s = statusBadge[t.status];
      m.bindPopup(`<div style="font-family:Inter,sans-serif"><b>${t.kanal}</b> <span style="color:#0284c7">${t.distance}</span><br/>${t.district}<br/><small>${t.region} · ${t.date}</small></div>`);
      bounds.push([t.lat, t.lng]);
    });
    // STA depth points sample around K02
    const k02 = MOCK.tasks[1];
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
  if (n) { n.read = true; persist(); renderNotifikasi(); }
};

window.markAllNotifRead = () => {
  state.notifications.forEach(n => n.read = true);
  persist(); renderNotifikasi();
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
    if (!confirm('Hapus semua data lokal? Tidak bisa di-undo.')) return;
    Object.keys(localStorage).filter(k => k.startsWith(STORAGE_NS)).forEach(k => localStorage.removeItem(k));
    location.reload();
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
// INIT
// ============================================================
function toggleConnectivity() {
  state.isOnline = !state.isOnline; refreshConnectivityUI();
  toast(state.isOnline ? 'Kembali online.' : 'Sekarang offline (simulasi).', state.isOnline ? 'ok' : 'warn');
}

window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

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
  });

  // Drop zones (re-attach after each route)
  window.addEventListener('hashchange', () => setTimeout(attachDropZones, 50));

  refreshConnectivityUI();
  route();
  attachDropZones();
});
