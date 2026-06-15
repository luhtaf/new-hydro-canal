/**
 * AddData (`/admin/data/:id/add`) — port `AddData.js`.
 * Tambah canal_data segment ke MainData (:id = MainData id). POST /data/:id.
 * Auto-split kanal > 999m diingatkan via badge (DOMAIN.md poin 6).
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { splitCanal } from '../../shared/domain/splitCanal.js';
import { PageShell } from './components/PageShell.js';
import { useAddSegment } from './hooks.js';
import {
  EMPTY_SEGMENT,
  Field,
  FieldGroup,
  formToSegment,
  validateSegment,
  type SegmentFormValues,
} from './components/SegmentForm.js';

export function AddData() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const add = useAddSegment(id);
  const [values, setValues] = useState<SegmentFormValues>(EMPTY_SEGMENT);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SegmentFormValues, string>>
  >({});

  const onChange = (name: keyof SegmentFormValues, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const panjang = parseFloat(values.canal_length) || 0;
  const segments = splitCanal(panjang);
  const willSplit = segments.length > 1;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateSegment(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast('Perbaiki field yang ditandai', 'err');
      return;
    }
    add.mutate(formToSegment(values), {
      onSuccess: () => {
        toast('Segmen ditambahkan', 'ok');
        nav(`/admin/data/${id}`);
      },
      onError: () => toast('Gagal menambah segmen', 'err'),
    });
  };

  const fp = { values, errors, onChange };

  return (
    <PageShell
      title="Tambah Segmen Canal"
      subtitle="Lengkapi parameter segmen. Field bertanda merah wajib diperbaiki."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {willSplit && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
            <Icon name="alert-triangle" className="h-4 w-4 shrink-0" />
            Kanal {panjang} m &gt; 999 m → akan jadi {segments.length} segmen (500
            m + {panjang - 500} m). STA sambungan di segmen ke-2 di-skip.
          </div>
        )}

        <FieldGroup title="Identitas">
          <Field label="Canal ID" name="canal_id" {...fp} mono placeholder="SB180202" />
          <Field label="Order No" name="order_no" {...fp} mono placeholder="2000349189" />
          <Field label="Operation No" name="operation_no" {...fp} mono />
          <Field label="Content name" name="content_name" {...fp} />
          <Field label="Measure point" name="measure_point" {...fp} mono />
          <Field label="USV code" name="usv_code" {...fp} mono placeholder="KBN01" />
        </FieldGroup>

        <FieldGroup title="Dimensi & STA">
          <Field label="STA start" name="start" {...fp} mono />
          <Field label="STA end" name="end" {...fp} mono />
          <Field label="Canal length (m)" name="canal_length" {...fp} type="number" />
          <Field label="Upper width" name="canal_upper_width" {...fp} type="number" />
          <Field label="Bottom width" name="canal_bottom_width" {...fp} type="number" />
          <Field label="Lane" name="lane" {...fp} type="number" />
          <Field label="Dimensi panjang" name="dim_panjang" {...fp} type="number" />
          <Field label="Dimensi lebar" name="dim_lebar" {...fp} type="number" />
          <Field label="Dimensi tinggi" name="dim_tinggi" {...fp} type="number" />
        </FieldGroup>

        <FieldGroup title="Parameter kedalaman">
          <Field label="Water level" name="water_level" {...fp} />
          <Field label="Tranducer" name="tranducer" {...fp} />
          <Field label="Bed float" name="bed_float" {...fp} />
          <Field label="Depth correction" name="depth_correction" {...fp} />
        </FieldGroup>

        <FieldGroup title="QC & jadwal">
          <Field label="QC type (QC/RE-QC)" name="qc_type" {...fp} />
          <Field label="Revision" name="revision" {...fp} mono />
          <Field label="Operator" name="operator" {...fp} />
          <Field label="QC date (Budat)" name="qc_date" {...fp} type="date" />
          <Field label="Measure date" name="measure_date" {...fp} type="date" />
        </FieldGroup>

        <FieldGroup title="Lokasi">
          <Field label="District name" name="district_name" {...fp} placeholder="D.SUNGAI_BEYUKU" />
          <Field label="District code" name="district_code" {...fp} mono placeholder="3C01" />
          <Field label="Region" name="region" {...fp} />
          <Field label="Coord X (UTM 48S)" name="coord_x" {...fp} type="number" />
          <Field label="Coord Y (UTM 48S)" name="coord_y" {...fp} type="number" />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn btn-primary" disabled={add.isPending}>
            <Icon name="check" className="h-4 w-4" />
            Simpan segmen
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => nav(`/admin/data/${id}`)}
          >
            Batal
          </button>
        </div>
      </form>
    </PageShell>
  );
}

export default AddData;
