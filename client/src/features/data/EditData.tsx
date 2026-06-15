/**
 * EditData (`/admin/data/:id/edit`) — port `EditData.js`.
 * Edit canal_data segment (:id = segment id). PATCH /data/:id.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { toast } from '../../shared/stores/ui.js';
import { PageShell } from './components/PageShell.js';
import { TableSkeleton, ErrorState } from './components/states.js';
import { useSegment, useUpdateSegment } from './hooks.js';
import {
  EMPTY_SEGMENT,
  Field,
  FieldGroup,
  formToSegment,
  segmentToForm,
  validateSegment,
  type SegmentFormValues,
} from './components/SegmentForm.js';

export function EditData() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useSegment(id);
  const update = useUpdateSegment(id);
  const [values, setValues] = useState<SegmentFormValues>(EMPTY_SEGMENT);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SegmentFormValues, string>>
  >({});

  useEffect(() => {
    if (data) setValues(segmentToForm(data));
  }, [data]);

  const onChange = (name: keyof SegmentFormValues, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  if (isLoading) {
    return (
      <PageShell title="Edit Segmen">
        <TableSkeleton rows={5} cols={3} />
      </PageShell>
    );
  }
  if (isError || !data) {
    return (
      <PageShell title="Edit Segmen">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateSegment(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast('Perbaiki field yang ditandai', 'err');
      return;
    }
    update.mutate(formToSegment(values), {
      onSuccess: () => {
        toast('Segmen diperbarui', 'ok');
        nav(-1);
      },
      onError: () => toast('Gagal menyimpan', 'err'),
    });
  };

  const fp = { values, errors, onChange };

  return (
    <PageShell
      title="Edit Segmen Canal"
      subtitle={<span className="font-mono text-slate-400">{data.canal_id}</span>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FieldGroup title="Identitas">
          <Field label="Canal ID" name="canal_id" {...fp} mono />
          <Field label="Order No" name="order_no" {...fp} mono />
          <Field label="Operation No" name="operation_no" {...fp} mono />
          <Field label="Content name" name="content_name" {...fp} />
          <Field label="Measure point" name="measure_point" {...fp} mono />
          <Field label="USV code" name="usv_code" {...fp} mono />
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
          <Field label="District name" name="district_name" {...fp} />
          <Field label="District code" name="district_code" {...fp} mono />
          <Field label="Region" name="region" {...fp} />
          <Field label="Coord X (UTM 48S)" name="coord_x" {...fp} type="number" />
          <Field label="Coord Y (UTM 48S)" name="coord_y" {...fp} type="number" />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn btn-primary" disabled={update.isPending}>
            <Icon name="check" className="h-4 w-4" />
            Simpan perubahan
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>
            Batal
          </button>
        </div>
      </form>
    </PageShell>
  );
}

export default EditData;
