/**
 * UndanganBaru (`/undangan/baru`, admin) — port demo `view-undangan-baru`.
 *
 * Wizard 4-step (Klien → Kanal → Jadwal → Review) dengan stepper indicator +
 * sticky ringkasan sidebar (demo touch "Multi-step wizard" + "Wizard sticky sidebar").
 * Auto-split kanal >999m via shared/domain splitCanal (badge "2 segmen"). Validasi
 * realtime: Order No 10 digit, Operation No default 0010, Measure Point tanpa spasi.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { shortName } from '../../shared/domain/shortName.js';
import { splitCanal } from '../../shared/domain/splitCanal.js';
import { buildFileName } from '../../shared/domain/fileName.js';
import { toast } from '../../shared/stores/ui.js';

interface CanalRow {
  id: string;
  canalId: string;
  panjang: string;
  dimensi: string;
}

interface FormState {
  contractor: string;
  region: string;
  district: string;
  districtCode: string;
  orderNo: string;
  operationNo: string;
  qcType: 'QC' | 'RE-QC';
  usv: string;
  qcDate: string;
  estDuration: string;
  operator: string;
  notes: string;
  rows: CanalRow[];
}

const STEPS = [
  { n: 1, title: 'Klien', sub: 'Kontraktor & region' },
  { n: 2, title: 'Kanal', sub: 'Daftar & parameter awal' },
  { n: 3, title: 'Jadwal', sub: 'Tanggal & petugas' },
  { n: 4, title: 'Review', sub: 'Konfirmasi & kirim' },
];

let rowSeq = 0;
const newRow = (init?: Partial<CanalRow>): CanalRow => ({
  id: `r${++rowSeq}`,
  canalId: '',
  panjang: '',
  dimensi: '',
  ...init,
});

export function UndanganBaru() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    contractor: 'PT MUSI NAULI LESTARI',
    region: 'Palembang',
    district: 'D.SUNGAI_BEYUKU',
    districtCode: '3C01',
    orderNo: '2000349500',
    operationNo: '0010',
    qcType: 'QC',
    usv: 'KBN01',
    qcDate: '2026-05-15',
    estDuration: '2 hari',
    operator: 'Fathul A.',
    notes: '',
    rows: [
      newRow({ canalId: 'KBN01-K01', panjang: '500', dimensi: '8X5X3' }),
      newRow({ canalId: 'KBN01-K02', panjang: '1200', dimensi: '8X5X3' }),
    ],
  });

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  // ── Validasi realtime ──
  const v = useMemo(() => {
    const orderNoOk = /^\d{10}$/.test(form.orderNo);
    const opNoDefault = form.operationNo === '0010';
    const validRows = form.rows.filter((r) => r.canalId.trim() && Number(r.panjang) > 0);
    const totalMeter = validRows.reduce((s, r) => s + (Number(r.panjang) || 0), 0);
    const splitRows = validRows.filter((r) => splitCanal(Number(r.panjang)).length > 1);
    const segmentCount = validRows.reduce((s, r) => s + splitCanal(Number(r.panjang)).length, 0);
    return { orderNoOk, opNoDefault, validRows, totalMeter, splitRows, segmentCount };
  }, [form.rows, form.orderNo, form.operationNo]);

  const previewFile = useMemo(
    () =>
      buildFileName({
        districtCode: form.districtCode,
        qcDate: new Date(form.qcDate),
        usv: form.usv,
        urut: 1,
        revision: 0,
        requestType: form.qcType,
      }),
    [form.districtCode, form.qcDate, form.usv, form.qcType],
  );

  const canSubmit = v.orderNoOk && v.validRows.length > 0;

  const submit = () => {
    if (!canSubmit) {
      toast('Lengkapi Order No (10 digit) & minimal 1 kanal valid', 'err');
      setStep(v.orderNoOk ? 2 : 1);
      return;
    }
    toast(`Undangan dibuat · ${v.validRows.length} kanal · ${v.segmentCount} segmen`, 'ok');
    nav('/undangan');
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/undangan" className="hover:text-slate-900">Undangan</Link>
        <Icon name="chevron-right" className="h-3 w-3" />
        <span className="font-medium text-slate-900">Undangan baru</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat undangan QC</h1>
          <p className="mt-1 text-sm text-slate-600">
            Lengkapi info klien, daftar kanal, dan jadwal pengukuran.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/undangan" className="btn btn-ghost">
            <Icon name="x" className="h-4 w-4" />
            Batal
          </Link>
          <button className="btn btn-ghost" onClick={() => toast('Draft disimpan ke perangkat', 'info')}>
            <Icon name="save" className="h-4 w-4" />
            Simpan draft
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSubmit}>
            <Icon name="send" className="h-4 w-4" />
            Buat &amp; assign
          </button>
        </div>
      </header>

      {/* Stepper */}
      <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
        <div className="grid grid-cols-2 text-xs sm:grid-cols-4">
          {STEPS.map((s) => {
            const active = s.n === step;
            const done = s.n < step;
            return (
              <button
                key={s.n}
                onClick={() => setStep(s.n)}
                className="relative flex items-center gap-2.5 p-3 text-left"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full font-bold transition ${
                    active || done
                      ? 'bg-brand-500 text-white shadow-soft'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {done ? <Icon name="check" className="h-3.5 w-3.5" /> : s.n}
                </span>
                <span>
                  <span className={`block font-semibold ${active || done ? 'text-slate-900' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                  <span className={active || done ? 'text-slate-500' : 'text-slate-400'}>{s.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {step === 1 && <StepKlien form={form} patch={patch} orderNoOk={v.orderNoOk} opNoDefault={v.opNoDefault} />}
          {step === 2 && <StepKanal form={form} setForm={setForm} v={v} />}
          {step === 3 && <StepJadwal form={form} patch={patch} />}
          {step === 4 && <StepReview form={form} v={v} previewFile={previewFile} />}

          {/* Nav antar step */}
          <div className="flex justify-between">
            <button
              className="btn btn-ghost"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <Icon name="chevron-left" className="h-4 w-4" />
              Sebelumnya
            </button>
            {step < 4 ? (
              <button className="btn btn-primary" onClick={() => setStep((s) => Math.min(4, s + 1))}>
                Lanjut
                <Icon name="arrow-right" className="h-4 w-4" />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={!canSubmit}>
                <Icon name="send" className="h-4 w-4" />
                Buat &amp; assign
              </button>
            )}
          </div>
        </div>

        {/* Sticky ringkasan */}
        <aside className="space-y-4">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="sec-title mb-3">Ringkasan</div>
            <div className="space-y-2 text-sm">
              <SummaryRow icon="building-2" text={`${shortName(form.contractor)} · ${form.district}`} />
              <SummaryRow icon="layers" text={`${v.validRows.length} kanal${v.splitRows.length ? ` (${v.splitRows.length} auto-split)` : ''}`} />
              <SummaryRow icon="calendar" text={form.qcDate} />
              <SummaryRow icon="user" text={form.operator} />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-2 text-xs text-slate-500">Validasi</div>
              <ul className="space-y-1.5 text-xs">
                <ValidItem ok={v.orderNoOk} label={v.orderNoOk ? 'Order No 10 digit' : 'Order No harus 10 digit'} />
                <ValidItem ok={v.opNoDefault} warn={!v.opNoDefault} label={v.opNoDefault ? 'Operation No = 0010' : 'Operation No bukan default'} />
                <ValidItem ok={v.validRows.length > 0} label={`${v.validRows.length} kanal valid`} />
                {v.splitRows.length > 0 && (
                  <ValidItem warn label={`${v.splitRows.length} kanal auto-split (${v.splitRows.map((r) => r.canalId).join(', ')})`} />
                )}
              </ul>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-2.5 text-xs">
              <div className="text-slate-500">Preview file</div>
              <div className="mt-0.5 break-all font-mono font-semibold text-slate-800">{previewFile}</div>
            </div>
            <button className="btn btn-primary mt-4 w-full justify-center" onClick={submit} disabled={!canSubmit}>
              <Icon name="send" className="h-4 w-4" />
              Buat &amp; assign
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Step 1: Klien ──
function StepKlien({
  form,
  patch,
  orderNoOk,
  opNoDefault,
}: {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
  orderNoOk: boolean;
  opNoDefault: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="sec-title">1. Klien &amp; region</div>
      </div>
      <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-700">Kontraktor</label>
          <div className="relative mt-1.5">
            <Icon name="building-2" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              value={form.contractor}
              onChange={(e) => patch({ contractor: e.target.value })}
            />
            <span className="absolute right-2.5 top-2 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              singkatan: {shortName(form.contractor)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Singkatan tampil di header chart export.</div>
        </div>
        <LabeledInput label="Region" value={form.region} onChange={(region) => patch({ region })} />
        <LabeledInput label="Distrik" value={form.district} onChange={(district) => patch({ district })} />
        <div>
          <label className="text-xs font-semibold text-slate-700">Order No</label>
          <input
            className={`input mt-1.5 font-mono ${
              form.orderNo ? (orderNoOk ? 'ring-1 ring-emerald-300' : 'ring-1 ring-rose-300') : ''
            }`}
            value={form.orderNo}
            onChange={(e) => patch({ orderNo: e.target.value })}
          />
          <ValidateMsg ok={orderNoOk} text={orderNoOk ? 'OK · 10 digit numerik' : 'Harus 10 digit numerik'} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Operation No</label>
          <input
            className={`input mt-1.5 ${opNoDefault ? 'ring-1 ring-emerald-300' : 'ring-1 ring-amber-300'}`}
            value={form.operationNo}
            onChange={(e) => patch({ operationNo: e.target.value })}
          />
          <ValidateMsg ok={opNoDefault} warn={!opNoDefault} text={opNoDefault ? 'OK · default 0010' : 'Bukan default 0010'} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">QC Type</label>
          <div className="mt-1.5 inline-flex w-full rounded-lg bg-slate-100 p-0.5">
            {(['QC', 'RE-QC'] as const).map((t) => (
              <button
                key={t}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  form.qcType === t ? 'bg-white text-slate-900 shadow-soft' : 'text-slate-600'
                }`}
                onClick={() => patch({ qcType: t })}
              >
                {t === 'QC' ? 'QC (Q1)' : 'RE-QC (Q2)'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">USV / Boat</label>
          <select className="input mt-1.5 font-mono" value={form.usv} onChange={(e) => patch({ usv: e.target.value })}>
            {['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05'].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

// ── Step 2: Kanal ──
function StepKanal({
  form,
  setForm,
  v,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  v: { totalMeter: number; splitRows: CanalRow[] };
}) {
  const update = (id: string, p: Partial<CanalRow>) =>
    setForm((f) => ({ ...f, rows: f.rows.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const remove = (id: string) => setForm((f) => ({ ...f, rows: f.rows.filter((r) => r.id !== id) }));
  const add = () => setForm((f) => ({ ...f, rows: [...f.rows, newRow()] }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div>
          <div className="sec-title">2. Daftar kanal</div>
          <div className="mt-0.5 text-xs text-slate-500">Kanal &gt;999m otomatis dibagi 2 segmen.</div>
        </div>
        <button className="btn btn-ghost text-xs" onClick={add}>
          <Icon name="plus" className="h-3.5 w-3.5" />
          Tambah baris
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">ID Kanal</th>
              <th className="px-3 py-2 text-left">Panjang (m)</th>
              <th className="px-3 py-2 text-left">Dimensi (P×L×T)</th>
              <th className="px-3 py-2 text-left">Auto-split</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {form.rows.map((r) => {
              const segs = Number(r.panjang) > 0 ? splitCanal(Number(r.panjang)) : [];
              const willSplit = segs.length > 1;
              return (
                <tr key={r.id} className={willSplit ? 'bg-amber-50/40' : ''}>
                  <td className="px-3 py-1.5">
                    <input
                      className="input input-sm font-mono"
                      value={r.canalId}
                      onChange={(e) => update(r.id, { canalId: e.target.value })}
                      placeholder="KBN01-K0x"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      className="input input-sm w-24"
                      value={r.panjang}
                      onChange={(e) => update(r.id, { panjang: e.target.value })}
                      inputMode="numeric"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      className="input input-sm"
                      value={r.dimensi}
                      onChange={(e) => update(r.id, { dimensi: e.target.value })}
                      placeholder="8X5X3"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    {willSplit ? (
                      <span className="badge bg-amber-100 text-amber-800">
                        <Icon name="split" className="h-3 w-3" />
                        {segs.length} segmen
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <button
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => remove(r.id)}
                      aria-label="Hapus baris"
                    >
                      <Icon name="trash-2" className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 p-3 text-xs text-slate-500">
        {form.rows.length} kanal · total{' '}
        <b className="text-slate-900">{v.totalMeter.toLocaleString('id-ID')} m</b>
        {v.splitRows.length > 0 && ` · ${v.splitRows.length} akan di-split (${v.splitRows.map((r) => r.canalId).join(', ')})`}
      </div>
    </section>
  );
}

// ── Step 3: Jadwal ──
function StepJadwal({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  const operators = [
    { name: 'Fathul A.', usv: 'KBN01', initials: 'FA', status: 'tersedia' },
    { name: 'Andi S.', usv: 'KBN02', initials: 'AS', status: 'tersedia' },
    { name: 'Rendi H.', usv: 'KBN03', initials: 'RH', status: 'cuti 12-16 Mei', disabled: true },
  ];
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="sec-title border-b border-slate-100 p-4">3. Jadwal &amp; petugas</div>
      <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-700">QC Date target</label>
          <input type="date" className="input mt-1.5" value={form.qcDate} onChange={(e) => patch({ qcDate: e.target.value })} />
        </div>
        <LabeledInput label="Estimasi durasi" value={form.estDuration} onChange={(estDuration) => patch({ estDuration })} />
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-700">Operator</label>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
            {operators.map((op) => {
              const selected = form.operator === op.name;
              return (
                <button
                  key={op.usv}
                  disabled={op.disabled}
                  onClick={() => patch({ operator: op.name, usv: op.usv })}
                  className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition ${
                    op.disabled
                      ? 'cursor-not-allowed border-slate-200 opacity-60'
                      : selected
                        ? 'border-brand-500 bg-brand-50/40'
                        : 'border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                    {op.initials}
                  </span>
                  <span className="text-xs">
                    <span className="block font-semibold">{op.name}</span>
                    <span className={op.disabled ? 'text-rose-600' : 'text-slate-500'}>
                      {op.usv} · {op.status}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-700">Catatan tambahan</label>
          <textarea
            className="input mt-1.5"
            rows={2}
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Misal: akses jalan rusak setelah hujan, perlu mobil 4×4"
          />
        </div>
      </div>
    </section>
  );
}

// ── Step 4: Review ──
function StepReview({
  form,
  v,
  previewFile,
}: {
  form: FormState;
  v: { validRows: CanalRow[]; segmentCount: number };
  previewFile: string;
}) {
  const rows: Array<[string, string]> = [
    ['Kontraktor', shortName(form.contractor)],
    ['Distrik', `${form.districtCode} ${form.district}`],
    ['Order', form.orderNo],
    ['QC Type', form.qcType === 'QC' ? 'QC (Q1)' : 'RE-QC (Q2)'],
    ['Kanal', `${v.validRows.length} kanal · ${v.segmentCount} segmen`],
    ['QC Date', form.qcDate],
    ['Operator', `${form.operator} (${form.usv})`],
    ['Preview file', previewFile],
  ];
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="sec-title border-b border-slate-100 p-4">4. Review</div>
      <div className="grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-2">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between border-b border-slate-100 py-1.5">
            <span className="text-slate-500">{k}</span>
            <span className={`font-semibold ${k === 'Preview file' || k === 'Order' ? 'font-mono text-xs' : ''}`}>{val}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Helpers UI ──
function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <input className="input mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ValidateMsg({ ok, warn, text }: { ok?: boolean; warn?: boolean; text: string }) {
  const tone = ok ? 'text-emerald-600' : warn ? 'text-amber-600' : 'text-rose-600';
  const icon = ok ? 'check' : warn ? 'alert-triangle' : 'alert-triangle';
  return (
    <div className={`mt-1 flex items-center gap-1 text-[11px] ${tone}`}>
      <Icon name={icon} className="h-3 w-3" />
      {text}
    </div>
  );
}

function SummaryRow({ icon, text }: { icon: 'building-2' | 'layers' | 'calendar' | 'user'; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="h-4 w-4 text-slate-400" />
      <span className="text-slate-600">{text}</span>
    </div>
  );
}

function ValidItem({ ok, warn, label }: { ok?: boolean; warn?: boolean; label: string }) {
  const tone = warn ? 'text-amber-700' : ok ? 'text-emerald-700' : 'text-rose-700';
  const icon = warn ? 'alert-triangle' : ok ? 'check-circle-2' : 'alert-triangle';
  return (
    <li className={`flex items-center gap-2 ${tone}`}>
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </li>
  );
}

export default UndanganBaru;
