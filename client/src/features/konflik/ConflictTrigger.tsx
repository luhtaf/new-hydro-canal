/**
 * ConflictTrigger — tombol "Trigger konflik baru" (DEMO ONLY).
 *
 * Demo ref: app.js triggerConflict + CONFLICT_TEMPLATES. Di produksi konflik
 * datang dari sync engine (push ditolak); tombol ini cuma simulasi supaya WM
 * bisa coba flow resolusi tanpa 2 device. Bergantian depth (single) ⇄ parameter
 * (multi) agar kedua resolver kelihatan.
 *
 * Catatan: ini menyuntik ConflictItem langsung ke store conflict.ts (state sesi),
 * BUKAN nulis ke Pouch — supaya resolusi demo tidak mencemari data nyata.
 */
import { useRef } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import { add } from '../../shared/db/conflict.js';
import { toast } from '../../shared/stores/ui.js';
import type { ConflictItem, SyncDoc } from '../../shared/types.js';

const DEPTH_SAMPLES = [
  { sta: 660, you: 2.91, them: 2.78 },
  { sta: 540, you: 2.43, them: 2.51 },
  { sta: 820, you: 3.12, them: 2.98 },
  { sta: 700, you: 2.65, them: 2.72 },
];

const PARAM_SAMPLES = [
  { wlYou: 2.15, wlThem: 2.18, trYou: 0.45, trThem: 0.48 },
  { wlYou: 2.2, wlThem: 2.15, trYou: 0.5, trThem: 0.46 },
];

function mkDoc(id: string, type: SyncDoc['type'], payload: Record<string, unknown>, t: string): SyncDoc {
  return { _id: id, type, payload, updatedAt: t, serverBase: null };
}

export function ConflictTrigger() {
  const idx = useRef(0);

  const trigger = () => {
    const i = idx.current++;
    const now = new Date();
    const earlier = new Date(now.getTime() - 60_000).toISOString();
    let item: ConflictItem;

    if (i % 2 === 0) {
      // Single-field depth.
      const s = DEPTH_SAMPLES[i % DEPTH_SAMPLES.length]!;
      const docId = `depth:KBN01-K02:${s.sta}`;
      const base = { water_level: 2.15, tranducer: 0.45, bed_float: 0.08, depth_correction: 0.02, sta: s.sta };
      item = {
        docId,
        type: 'depth',
        lokal: mkDoc(docId, 'depth', { ...base, depth: s.you }, now.toISOString()),
        server: mkDoc(docId, 'depth', { ...base, depth: s.them }, earlier),
        strategy: 'manual',
        detectedAt: now.toISOString(),
      };
    } else {
      // Multi-field parameter.
      const p = PARAM_SAMPLES[i % PARAM_SAMPLES.length]!;
      const docId = `parameter:KBN01-K02`;
      item = {
        docId,
        type: 'parameter',
        lokal: mkDoc(
          docId,
          'parameter',
          { water_level: p.wlYou, tranducer: p.trYou, bed_float: 0.08, depth_correction: 0.02 },
          now.toISOString(),
        ),
        server: mkDoc(
          docId,
          'parameter',
          { water_level: p.wlThem, tranducer: p.trThem, bed_float: 0.08, depth_correction: 0.02 },
          earlier,
        ),
        strategy: 'lww',
        detectedAt: now.toISOString(),
      };
    }

    add(item);
    toast(`Konflik baru pada ${item.docId} — minta resolusi`, 'warn');
  };

  return (
    <button
      className="btn btn-ghost text-xs"
      title="Simulasi konflik baru muncul (demo)"
      onClick={trigger}
    >
      <Icon name="zap" className="w-3.5 h-3.5" />
      Trigger konflik baru
    </button>
  );
}
