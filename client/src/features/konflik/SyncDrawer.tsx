/**
 * SyncDrawer — drawer slide-in dari kanan berisi antrian sinkronisasi.
 *
 * Demo ref: index.html #sync-drawer + app.js renderSyncList/forceSyncAll/openDrawer.
 * Open-state di ui store (`syncDrawerOpen`); isi antrian dari outbox PouchDB
 * (useSyncQueue). "Sinkron sekarang" → syncNow() (pull + push). Empty state
 * "Semua tersinkron". ESC / klik backdrop / tombol Tutup untuk menutup.
 *
 * Render via Portal supaya selalu di atas layout (sama seperti demo overlay).
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../shared/layout/Icon.js';
import { useUi, toast } from '../../shared/stores/ui.js';
import { useSyncQueue } from './useSyncQueue.js';
import { syncNow, dropOp } from '../../shared/db/sync.js';
import { useAuthStore } from '../auth/store.js';

/** Ringkas jenis doc untuk label antrian. */
function kindLabel(type: string): string {
  switch (type) {
    case 'depth':
      return 'Edit kedalaman';
    case 'parameter':
      return 'Parameter';
    case 'canal':
      return 'Update canal';
    default:
      return 'Perubahan';
  }
}

export function SyncDrawer() {
  const open = useUi((s) => s.syncDrawerOpen);
  const close = useUi((s) => s.closeSyncDrawer);
  const online = useUi((s) => s.online);
  const ops = useSyncQueue();
  const activeUserId = useAuthStore((s) => s.activeUserId);

  // ESC untuk menutup (sama seperti overlay lain).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || typeof document === 'undefined') return null;

  const onForceSync = async () => {
    if (!online) return toast('Tidak bisa sinkron — perangkat offline.', 'warn');
    if (ops.length === 0) return toast('Sudah tersinkron.', 'ok');
    const n = ops.length;
    await syncNow();
    toast(`Memproses ${n} item antrian…`, 'info');
  };

  return createPortal(
    <div id="sync-drawer" className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-pop animate-slide-up flex flex-col">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900">Antrian sinkronisasi</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Perubahan offline akan dikirim ke server saat online
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Tutup">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2 overflow-y-auto flex-1">
          {ops.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Icon name="cloud-check" className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <div className="text-sm font-medium text-slate-600">Semua tersinkron</div>
              <div className="text-xs">Tidak ada perubahan tertunda</div>
            </div>
          ) : (
            ops.map((op) => (
              <div
                key={op.docId}
                className="p-3 rounded-lg border border-slate-200 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 grid place-items-center text-amber-600 shrink-0">
                  <Icon name="clock" className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{kindLabel(op.doc.type)}</div>
                  <div className="text-xs text-slate-500 truncate font-mono">{op.docId}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {op.attempts > 0 ? `percobaan ke-${op.attempts} · ` : ''}
                    {new Date(op.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>
                {activeUserId && (
                  <button
                    className="text-xs text-slate-500 hover:text-rose-600"
                    title="Buang dari antrian"
                    onClick={() => void dropOp(activeUserId, op.docId)}
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center gap-2">
          <button className="btn btn-primary flex-1" onClick={() => void onForceSync()}>
            <Icon name="cloud-upload" className="w-4 h-4" />
            Sinkron sekarang
          </button>
          <button className="btn btn-ghost" onClick={close}>
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
