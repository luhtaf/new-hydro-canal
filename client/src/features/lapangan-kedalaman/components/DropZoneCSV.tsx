/**
 * DropZoneCSV — drag-drop / klik untuk import file kedalaman (CSV/TXT/XLSX).
 * Port demo drop-zone + handleCSVImport. Parsing pakai parsePage3 (slice data)
 * supaya 1 parser dipakai admin bulk import & lapangan (jangan duplikat).
 *
 * Mendukung multi-file (Excel page 3 banyak sheet/file) — tiap file di-parse lalu
 * digabung dan diserahkan ke parent lewat onParsed.
 */
import { useRef, useState } from 'react';
import { Icon } from '../../../shared/layout/Icon.js';
import { toast } from '../../../shared/stores/ui.js';
import { parsePage3 } from '../../data/excelPage3.js';
import type { DepthPoint } from '../../../shared/types.js';

interface Props {
  /** Dipanggil dengan titik hasil parse (gabungan semua file). */
  onParsed: (points: DepthPoint[], summary: { files: number; rows: number; skipped: number }) => void;
  /** izinkan banyak file sekaligus (multi-Excel page 3). */
  multiple?: boolean;
}

export function DropZoneCSV({ onParsed, multiple = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const all: DepthPoint[] = [];
      let rows = 0;
      let skipped = 0;
      for (const file of list) {
        const res = await parsePage3(file);
        all.push(...res.points);
        rows += res.rowCount;
        skipped += res.skipped;
      }
      onParsed(all, { files: list.length, rows, skipped });
      toast(
        `Import ${list.length} file · ${all.length} titik (lewat ${skipped})·masuk antrian sync`,
        all.length ? 'ok' : 'warn',
      );
    } catch {
      toast('Gagal membaca file. Pastikan format CSV/XLSX page 3.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={[
          'w-full rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
          over
            ? 'border-brand-400 bg-brand-50/60'
            : 'border-slate-300 bg-slate-50/50 hover:border-slate-400',
          busy ? 'opacity-60 pointer-events-none' : '',
        ].join(' ')}
      >
        <Icon
          name="cloud-upload"
          className={`mx-auto mb-1.5 h-7 w-7 text-slate-400 ${busy ? 'animate-pulse' : ''}`}
        />
        <div className="text-xs font-medium text-slate-600">
          {busy ? 'Memproses…' : 'Drag-drop CSV/XLSX di sini'}
        </div>
        <div className="mt-1 text-[10px] text-slate-400">
          Kolom: STA, Latitude, Longitude, Depth, Date · {multiple ? 'multi-file' : '1 file'}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.xlsx,.xls"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
