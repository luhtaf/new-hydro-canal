/**
 * SyncDrawer — drawer kanan antrian sinkronisasi (demo touch).
 *
 * Demo ref: index.html #sync-drawer + app.js renderSyncList/forceSyncAll. Empty
 * state "Semua tersinkron" dengan ikon cloud-check. Di shell ini queue dari ui store;
 * saat slice sync siap, sumbernya pindah ke PouchDB outbox (touches_features: [sync]).
 */
import { useUi } from '../stores/ui.js';
import { Icon } from './Icon.js';

export function SyncDrawer() {
  const open = useUi((s) => s.syncDrawerOpen);
  const close = useUi((s) => s.closeSyncDrawer);
  const queue = useUi((s) => s.queue);
  const dequeue = useUi((s) => s.dequeue);
  const clearQueue = useUi((s) => s.clearQueue);
  const online = useUi((s) => s.online);
  const toast = useUi((s) => s.toast);

  if (!open) return null;

  const forceSync = () => {
    if (!online) {
      toast('Masih offline — antrian dikirim saat online kembali.', 'warn');
      return;
    }
    if (queue.length === 0) {
      toast('Tidak ada perubahan tertunda.', 'info');
      return;
    }
    clearQueue();
    toast('Semua perubahan disinkronkan.', 'ok');
    close();
  };

  return (
    <div id="sync-drawer" className="fixed inset-0 z-50 no-print">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-pop animate-slide-up flex flex-col">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900">Antrian sinkronisasi</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Perubahan offline akan dikirim ke server saat online
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-slate-100" onClick={close} aria-label="Tutup">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2 overflow-y-auto flex-1">
          {queue.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Icon name="cloud-check" className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <div className="text-sm font-medium text-slate-600">Semua tersinkron</div>
              <div className="text-xs">Tidak ada perubahan tertunda</div>
            </div>
          ) : (
            queue.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-lg border border-slate-200 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 grid place-items-center text-amber-600 shrink-0">
                  <Icon name="clock" className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{q.kind}</div>
                  <div className="text-xs text-slate-500 truncate">{q.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {q.size} · {q.when}
                  </div>
                </div>
                <button
                  className="text-xs text-slate-500 hover:text-rose-600"
                  onClick={() => dequeue(q.id)}
                  aria-label="Hapus dari antrian"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center gap-2">
          <button className="btn btn-primary flex-1 justify-center" onClick={forceSync}>
            <Icon name="cloud-upload" className="w-4 h-4" />
            Sinkron sekarang
          </button>
          <button className="btn btn-ghost" onClick={close}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
