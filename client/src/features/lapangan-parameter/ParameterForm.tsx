/**
 * ParameterForm (`/lapangan/parameter/:canalId`) — port demo
 * `view-lapangan-parameter` + `attachParameterDateLogic` + `attachValidators`.
 *
 * FE-only. Auto-fill dari assignment (doc `canal:<canalId>`), simpan draft ke
 * PouchDB `parameter:<canalId>` lewat sync engine. Validasi inline realtime
 * (react-hook-form + zod) dgn border red/orange/green. Measure Date di-CLAMP ke
 * Finish Date AOI (DOMAIN.md poin 3). Sidebar: checklist + preview filename
 * (buildFileName, DOMAIN.md poin 7) + tombol "Input kedalaman".
 */
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { useAuth } from '../auth/hooks.js';
import { buildFileName } from '../../shared/domain/fileName.js';
import {
  parameterSchema,
  softWarnings,
  type ParameterFormValues,
  type ParameterFormOutput,
} from './schema.js';
import {
  useAssignment,
  useParameterDraft,
  useSaveParameter,
  type ParameterDraftPayload,
} from './hooks.js';
import {
  SectionCard,
  ValidatedField,
  ValidationChecklist,
  type ChecklistItem,
  type FieldTone,
} from './components.js';

/** Default kosong sebelum auto-fill datang. */
const EMPTY: ParameterFormValues = {
  canalId: '',
  orderNo: '',
  operationNo: '0010',
  district: '',
  contractor: '',
  measurePoint: '',
  startSta: 0,
  endSta: 0,
  panjang: 0,
  dimensi: '',
  coordX: 0,
  coordY: 0,
  waterLevel: '',
  tranducer: '',
  bedFloat: '',
  depthCorrection: '',
  qcType: 'QC',
  revision: '000',
  qcDate: new Date().toISOString().slice(0, 10),
  measureDate: new Date().toISOString().slice(0, 10),
};

export function ParameterForm() {
  const { canalId = '' } = useParams();
  const nav = useNavigate();
  const { account } = useAuth();
  const assignment = useAssignment(canalId);
  const draft = useParameterDraft(canalId);
  const saveParameter = useSaveParameter(canalId);

  const finishDate = assignment?.payload.finishDate ?? '';

  const schema = useMemo(
    () => parameterSchema(assignment?.payload.canalId ?? canalId),
    [assignment?.payload.canalId, canalId],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<ParameterFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: EMPTY,
  });

  // Auto-fill: prioritas draft tersimpan, lalu assignment, lalu kosong.
  useEffect(() => {
    if (draft) {
      reset({ ...EMPTY, ...draft.payload });
      return;
    }
    if (assignment) {
      const a = assignment.payload;
      reset({
        ...EMPTY,
        canalId: a.canalId,
        orderNo: a.orderNo,
        district: a.district,
        contractor: a.contractor,
        measurePoint: a.measurePoint,
        startSta: 0,
        endSta: a.panjang,
        panjang: a.panjang,
        dimensi: a.dimensi,
        coordX: a.coordX,
        coordY: a.coordY,
        qcType: a.requestType ?? 'QC',
      });
    }
    // hanya jalan saat sumber auto-fill pertama hadir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?._id, assignment?._id]);

  const values = watch();

  // CLAMP Measure Date → Finish Date AOI (DOMAIN.md poin 3 / attachParameterDateLogic).
  const onMeasureDateChange = (raw: string) => {
    if (finishDate && raw && raw > finishDate) {
      setValue('measureDate', finishDate, { shouldValidate: true, shouldTouch: true });
      toast(`Measure Date di-clamp ke Finish Date ${finishDate} — pengukuran lewat SPK.`, 'warn');
    } else {
      setValue('measureDate', raw, { shouldValidate: true, shouldTouch: true });
    }
  };

  // Tone per-field: error→merah, belum disentuh & kosong→idle, else hijau.
  const toneOf = (
    name: keyof ParameterFormValues,
    opts?: { warnWhen?: boolean },
  ): FieldTone => {
    if (errors[name]) return 'err';
    if (opts?.warnWhen) return 'warn';
    const v = values[name];
    const touched = touchedFields[name];
    if (!touched && (v === '' || v === 0)) return 'idle';
    return 'ok';
  };

  const opWarn = String(values.operationNo ?? '').trim() !== '0010' && !!values.operationNo;
  const warnings = softWarnings(values);

  // Preview filename (DOMAIN.md poin 7). districtCode dari assignment, fallback "----".
  const filename = useMemo(() => {
    const districtCode = assignment?.payload.districtCode ?? '----';
    const usv = account?.usv ?? 'KBN--';
    const qcDate = values.qcDate ? new Date(values.qcDate) : new Date();
    return buildFileName({
      districtCode,
      qcDate,
      usv,
      urut: 1,
      revision: Number(values.revision) || 0,
      requestType: values.qcType === 'RE-QC' ? 'RE-QC' : 'QC',
    });
  }, [assignment?.payload.districtCode, account?.usv, values.qcDate, values.revision, values.qcType]);

  // Checklist validasi (sidebar) — turunan dari error state realtime.
  const checklist: ChecklistItem[] = [
    {
      label: 'Panjang kanal = Σ STA (End − Start)',
      tone: errors.panjang ? 'err' : 'ok',
    },
    {
      label: `ID kanal sesuai penugasan (${assignment?.payload.canalId ?? canalId})`,
      tone: errors.canalId ? 'err' : 'ok',
    },
    { label: 'Measure Point numerik tanpa spasi', tone: errors.measurePoint ? 'err' : 'ok' },
    { label: 'Order No 10 digit', tone: errors.orderNo ? 'err' : 'ok' },
    {
      label: 'Operation No = 0010',
      tone: opWarn ? 'warn' : 'ok',
    },
    {
      label: 'Desimal parameter ≤ 3 angka',
      tone:
        errors.waterLevel || errors.tranducer || errors.bedFloat || errors.depthCorrection
          ? 'err'
          : 'ok',
    },
  ];

  const toDraft = (v: ParameterFormOutput): ParameterDraftPayload => ({
    canalId: v.canalId,
    orderNo: v.orderNo,
    operationNo: v.operationNo,
    district: v.district,
    contractor: v.contractor,
    measurePoint: v.measurePoint,
    startSta: v.startSta,
    endSta: v.endSta,
    panjang: v.panjang,
    dimensi: v.dimensi,
    coordX: v.coordX,
    coordY: v.coordY,
    waterLevel: v.waterLevel,
    tranducer: v.tranducer,
    bedFloat: v.bedFloat,
    depthCorrection: v.depthCorrection,
    qcType: v.qcType,
    revision: v.revision,
    qcDate: v.qcDate,
    measureDate: v.measureDate,
  });

  const persist = async (v: ParameterFormOutput) => {
    await saveParameter(toDraft(v));
    toast('Parameter disimpan ke perangkat (antrian sync).', 'ok');
  };

  const onSave = handleSubmit(
    async (v) => {
      await persist(v as ParameterFormOutput);
    },
    () => toast('Perbaiki field yang ditandai merah dulu.', 'err'),
  );

  const onNext = handleSubmit(
    async (v) => {
      await persist(v as ParameterFormOutput);
      nav(`/lapangan/kedalaman/${canalId}`);
    },
    () => toast('Lengkapi & perbaiki parameter sebelum lanjut ke kedalaman.', 'err'),
  );

  const onReset = () => {
    if (assignment) {
      reset(EMPTY);
      toast('Form di-reset ke kosong.', 'ok');
    }
  };

  const canalLabel = assignment?.payload.canalId ?? canalId;
  const districtLabel = assignment?.payload.district ?? '—';
  const contractorLabel = assignment?.payload.contractor ?? '—';
  const reg = (name: keyof ParameterFormValues) => register(name);

  return (
    <div className="space-y-5">
      {/* Breadcrumb (demo touch) */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <button onClick={() => nav('/penugasan')} className="hover:text-slate-900">
          Penugasan
        </button>
        <Icon name="chevron-right" className="h-3 w-3" />
        <span className="font-mono">{canalLabel}</span>
        <Icon name="chevron-right" className="h-3 w-3" />
        <span className="font-medium text-slate-900">Input Parameter</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Parameter QC — <span className="font-mono">{canalLabel}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Order <span className="font-mono">{values.orderNo || '—'}</span> · {districtLabel} ·{' '}
            {contractorLabel}.{' '}
            <span className="text-amber-700">Disimpan otomatis ke perangkat.</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            <Icon name="rotate-ccw" className="h-4 w-4" />
            Reset
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={isSubmitting}>
            <Icon name="save" className="h-4 w-4" />
            Simpan
          </button>
        </div>
      </header>

      {!assignment && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Icon name="info" className="h-4 w-4 shrink-0" />
          Assignment <span className="font-mono">{canalId}</span> belum ter-seed di perangkat —
          isi manual atau sinkron dulu dari Penugasan.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* ── Informasi kanal ── */}
          <SectionCard
            title="Informasi kanal"
            icon="map-pin"
            status={
              errors.canalId || errors.orderNo || errors.measurePoint || errors.panjang
                ? { tone: 'err', label: 'Periksa field' }
                : { tone: 'ok', label: 'Tervalidasi' }
            }
          >
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <ValidatedField
                label="Canal ID"
                mono
                value={String(values.canalId ?? '')}
                onChange={(v) => setValue('canalId', v, { shouldValidate: true, shouldTouch: true })}
                tone={toneOf('canalId')}
                hint={errors.canalId?.message}
                badge="match page 3"
                badgeTone={errors.canalId ? 'err' : 'ok'}
              />
              <ValidatedField
                label="Order No"
                mono
                value={String(values.orderNo ?? '')}
                onChange={(v) => setValue('orderNo', v, { shouldValidate: true, shouldTouch: true })}
                tone={toneOf('orderNo')}
                hint={errors.orderNo?.message ?? '10 digit numerik'}
              />
              <ValidatedField
                label="Operation No"
                value={String(values.operationNo ?? '')}
                onChange={(v) =>
                  setValue('operationNo', v, { shouldValidate: true, shouldTouch: true })
                }
                tone={errors.operationNo ? 'err' : opWarn ? 'warn' : toneOf('operationNo')}
                hint={
                  errors.operationNo?.message ??
                  (opWarn ? 'Bukan default 0010 — pastikan sesuai SOP' : 'Default 0010')
                }
              />
              <ValidatedField
                label="District"
                value={String(values.district ?? '')}
                onChange={(v) => setValue('district', v, { shouldValidate: true, shouldTouch: true })}
                tone={toneOf('district')}
                hint={errors.district?.message}
                readOnly={!!assignment}
              />
              <ValidatedField
                label="Contractor"
                value={String(values.contractor ?? '')}
                onChange={(v) =>
                  setValue('contractor', v, { shouldValidate: true, shouldTouch: true })
                }
                tone={toneOf('contractor')}
                hint={errors.contractor?.message}
                readOnly={!!assignment}
              />
              <ValidatedField
                label="Measure Point"
                value={String(values.measurePoint ?? '')}
                onChange={(v) =>
                  setValue('measurePoint', v, { shouldValidate: true, shouldTouch: true })
                }
                tone={toneOf('measurePoint')}
                hint={errors.measurePoint?.message ?? 'Numerik, tanpa spasi'}
              />
              <ValidatedField
                label="Start STA"
                type="number"
                value={String(values.startSta ?? 0)}
                onChange={(v) =>
                  setValue('startSta', v as unknown as number, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                tone={toneOf('startSta')}
                hint={errors.startSta?.message}
              />
              <ValidatedField
                label="End STA"
                type="number"
                value={String(values.endSta ?? 0)}
                onChange={(v) =>
                  setValue('endSta', v as unknown as number, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                tone={toneOf('endSta')}
                hint={errors.endSta?.message}
              />
              <ValidatedField
                label="Panjang kanal (m)"
                type="number"
                value={String(values.panjang ?? 0)}
                onChange={(v) =>
                  setValue('panjang', v as unknown as number, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                tone={toneOf('panjang')}
                hint={errors.panjang?.message ?? 'Harus = Σ STA'}
                badge={errors.panjang ? undefined : 'match Σ STA'}
              />
              <ValidatedField
                label="Dimensi (P×L×T)"
                value={String(values.dimensi ?? '')}
                onChange={(v) => setValue('dimensi', v, { shouldValidate: true, shouldTouch: true })}
                tone={toneOf('dimensi')}
                hint={errors.dimensi?.message}
              />
              <ValidatedField
                label="Coordinate X (UTM)"
                mono
                type="number"
                value={String(values.coordX ?? 0)}
                onChange={(v) =>
                  setValue('coordX', v as unknown as number, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                tone={toneOf('coordX')}
                hint={errors.coordX?.message}
                readOnly={!!assignment}
              />
              <ValidatedField
                label="Coordinate Y (UTM)"
                mono
                type="number"
                value={String(values.coordY ?? 0)}
                onChange={(v) =>
                  setValue('coordY', v as unknown as number, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                tone={toneOf('coordY')}
                hint={errors.coordY?.message}
                readOnly={!!assignment}
              />
            </div>
          </SectionCard>

          {/* ── Parameter pengukuran ── */}
          <SectionCard title="Parameter pengukuran" icon="ruler">
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <ValidatedField
                label="Water level (m)"
                value={String(values.waterLevel ?? '')}
                onChange={(v) =>
                  setValue('waterLevel', v, { shouldValidate: true, shouldTouch: true })
                }
                tone={toneOf('waterLevel')}
                hint={errors.waterLevel?.message ?? 'maks 3 angka belakang titik'}
              />
              <ValidatedField
                label="Tranducer"
                value={String(values.tranducer ?? '')}
                onChange={(v) =>
                  setValue('tranducer', v, { shouldValidate: true, shouldTouch: true })
                }
                tone={toneOf('tranducer')}
                hint={errors.tranducer?.message ?? 'maks 3 desimal'}
              />
              <ValidatedField
                label="Bed float"
                value={String(values.bedFloat ?? '')}
                onChange={(v) => setValue('bedFloat', v, { shouldValidate: true, shouldTouch: true })}
                tone={toneOf('bedFloat')}
                hint={errors.bedFloat?.message ?? 'maks 3 desimal'}
              />
              <ValidatedField
                label="Depth correction"
                value={String(values.depthCorrection ?? '')}
                onChange={(v) =>
                  setValue('depthCorrection', v, { shouldValidate: true, shouldTouch: true })
                }
                tone={toneOf('depthCorrection')}
                hint={errors.depthCorrection?.message ?? 'maks 3 desimal'}
              />
              <div>
                <label className="text-xs font-semibold text-slate-700">QC Type</label>
                <select className="input mt-1.5" {...reg('qcType')}>
                  <option value="QC">QC (Q1)</option>
                  <option value="RE-QC">RE-QC (Q2)</option>
                </select>
              </div>
              <ValidatedField
                label="Revision"
                mono
                value={String(values.revision ?? '')}
                onChange={(v) => setValue('revision', v, { shouldValidate: true, shouldTouch: true })}
                tone={toneOf('revision')}
                hint={errors.revision?.message}
              />
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div className="text-brand-900">
                <b>Final depth</b> dihitung otomatis di input kedalaman:{' '}
                <code className="font-mono">
                  (depth + WL + tranducer + bed_float − correction) × −1
                </code>{' '}
                (di-flip untuk grafik).
              </div>
            </div>
          </SectionCard>

          {/* ── Tanggal ── */}
          <SectionCard title="Tanggal" icon="calendar">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">QC Date / Budat</label>
                <input type="date" className="input mt-1.5" {...reg('qcDate')} />
                <div className="mt-1 text-[11px] text-slate-500">
                  Tanggal pengolahan s/d upload data.
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Measure Date</label>
                <input
                  type="date"
                  className={`input mt-1.5 ${
                    finishDate && values.measureDate === finishDate ? 'border-amber-400' : ''
                  }`}
                  value={String(values.measureDate ?? '')}
                  onChange={(e) => onMeasureDateChange(e.target.value)}
                />
                <div
                  className={`mt-1 text-[11px] ${
                    finishDate && values.measureDate === finishDate
                      ? 'font-semibold text-amber-600'
                      : 'text-slate-500'
                  }`}
                >
                  {finishDate && values.measureDate === finishDate
                    ? `Auto-clamp ke Finish Date (${finishDate}) — pengukuran lewat SPK.`
                    : 'Tanggal pengukuran asli.'}
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs sm:col-span-2">
                <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-amber-900">
                  Jika tanggal pengukuran <b>melewati Finish Date AOI</b> (
                  <span className="font-mono">{finishDate || '—'}</span>), Measure Date otomatis
                  di-set ke Finish Date (DOMAIN.md poin 3).
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="sec-title mb-3 text-base">Validasi</div>
            <ValidationChecklist items={checklist} />
            {warnings.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11px] text-amber-600">
                {warnings.map((w) => (
                  <div key={w} className="flex items-start gap-1.5">
                    <Icon name="alert-triangle" className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="sec-title mb-3 flex items-center gap-2 text-base">
              <Icon name="file-text" className="h-4 w-4 text-brand-600" />
              Preview nama file
            </div>
            <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
              {filename}.txt
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Format:{' '}
              <code className="font-mono">[district]-[YYMMDD]-[usv]-[urut][rev][qctype]</code>.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="mb-2 text-xs font-semibold text-slate-700">Selanjutnya</div>
            <button
              type="button"
              className="btn btn-primary w-full justify-center"
              onClick={onNext}
              disabled={isSubmitting}
            >
              Input kedalaman <Icon name="arrow-right" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParameterForm;
