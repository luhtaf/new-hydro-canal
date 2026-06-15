/**
 * SingleFieldResolver — kartu konflik kedalaman (single-field).
 *
 * Demo ref: index.html template view-konflik article pertama + triggerConflict.
 * Side-by-side "Versi kamu (lokal)" vs "Versi server" dengan radio pick.
 * Preview final depth dihitung via shared/domain/depth.ts (sinkron formula).
 *
 * Strategi default depth = manual (operator wajib pilih; spec § D).
 */
import { useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import { finalDepth } from '../../shared/domain/depth.js';
import type { ConflictItem, DepthParams } from '../../shared/types.js';
import type { Side } from '../../shared/db/conflict.js';

/** Ambil angka depth + param dari payload (toleran field hilang). */
function depthOf(payload: Record<string, unknown>): number {
  const v = payload['depth'];
  return typeof v === 'number' ? v : Number(v ?? 0);
}
function num(payload: Record<string, unknown>, k: keyof DepthParams): number {
  const v = payload[k];
  return typeof v === 'number' ? v : Number(v ?? 0);
}
function finalOf(payload: Record<string, unknown>): number {
  return finalDepth({
    depth: depthOf(payload),
    water_level: num(payload, 'water_level'),
    tranducer: num(payload, 'tranducer'),
    bed_float: num(payload, 'bed_float'),
    depth_correction: num(payload, 'depth_correction'),
  });
}

export function SingleFieldResolver({
  conflict,
  resolving,
  onResolve,
  onDefer,
}: {
  conflict: ConflictItem;
  resolving: boolean;
  onResolve: (pick: Side) => void;
  onDefer: () => void;
}) {
  const [pick, setPick] = useState<Side>('lokal');
  const lokalP = conflict.lokal.payload as Record<string, unknown>;
  const serverP = conflict.server.payload as Record<string, unknown>;
  const name = `c-${conflict.docId}`;

  return (
    <article className="bg-white rounded-xl border-2 border-rose-200 shadow-soft overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-rose-50 to-white border-b border-rose-100 flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-100 grid place-items-center text-rose-600">
          <Icon name="git-merge" className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold font-mono">{conflict.docId}</div>
          <div className="text-xs text-slate-600">
            Data kedalaman · field <code className="font-mono">depth</code> berbeda
          </div>
        </div>
        <span className="badge bg-rose-100 text-rose-700">Manual</span>
        <span className="text-xs text-slate-500">
          {new Date(conflict.detectedAt).toLocaleTimeString('id-ID')}
        </span>
      </div>

      <div className="grid md:grid-cols-2 divide-x divide-slate-100">
        <label className="p-4 cursor-pointer hover:bg-emerald-50/30 transition relative">
          <input
            type="radio"
            name={name}
            checked={pick === 'lokal'}
            onChange={() => setPick('lokal')}
            className="absolute top-4 right-4"
          />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-[10px] font-bold">
              FA
            </div>
            <div className="text-xs">
              <div className="font-semibold text-slate-900">Versi kamu (lokal)</div>
              <div className="text-slate-500">
                edit offline · {new Date(conflict.lokal.updatedAt).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-sm">
            <div className="text-slate-500 text-xs mb-1">depth</div>
            <div className="font-bold text-emerald-600 text-lg">{depthOf(lokalP).toFixed(3)}</div>
            <div className="text-slate-400 text-xs mt-2">
              final: <b>{finalOf(lokalP).toFixed(3)}</b>
            </div>
          </div>
        </label>

        <label className="p-4 cursor-pointer hover:bg-emerald-50/30 transition relative">
          <input
            type="radio"
            name={name}
            checked={pick === 'server'}
            onChange={() => setPick('server')}
            className="absolute top-4 right-4"
          />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center text-white text-[10px] font-bold">
              AS
            </div>
            <div className="text-xs">
              <div className="font-semibold text-slate-900">Versi server</div>
              <div className="text-slate-500">
                sync · {new Date(conflict.server.updatedAt).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-sm">
            <div className="text-slate-500 text-xs mb-1">depth</div>
            <div className="font-bold text-rose-600 text-lg">{depthOf(serverP).toFixed(3)}</div>
            <div className="text-slate-400 text-xs mt-2">
              final: <b>{finalOf(serverP).toFixed(3)}</b>
            </div>
          </div>
        </label>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost text-xs">
          <Icon name="line-chart" className="w-3.5 h-3.5" />
          Lihat di chart
        </button>
        <div className="ml-auto flex gap-2">
          <button className="btn btn-ghost text-xs" onClick={onDefer} disabled={resolving}>
            Tangguhkan
          </button>
          <button
            className="btn btn-primary text-xs"
            onClick={() => onResolve(pick)}
            disabled={resolving}
          >
            <Icon name="check" className="w-3.5 h-3.5" />
            Selesaikan
          </button>
        </div>
      </div>
    </article>
  );
}
