/**
 * depthDoc — jalur tulis doc PouchDB kedalaman (`depth:<canalId>:<sta>`).
 *
 * SATU JALUR TULIS (shared/db/sync.ts): UI menulis lewat `writeDepth()` (yang
 * memanggil `writeDoc`), bukan `getPouch().put` langsung — kalau bypass, op tidak
 * masuk outbox → data hilang saat offline.
 *
 * Helper murni (id/formula/threshold) ada di depthMath.ts supaya bisa di-test tanpa
 * dependensi PouchDB; file ini hanya menambah efek samping tulis.
 */
import { writeDoc } from '../../shared/db/sync.js';
import { depthDocId, type DepthPayload } from './depthMath.js';
import type { SyncDoc } from '../../shared/types.js';

// Re-export helper murni supaya konsumen cukup impor dari satu tempat.
export {
  DEPTH_PREFIX,
  depthDocId,
  payloadParams,
  displayedOf,
  rawDepthFromFinal,
  statusOf,
  type DepthPayload,
} from './depthMath.js';

/**
 * Tulis 1 titik kedalaman ke PouchDB lewat sync engine.
 * Menjaga _rev terkini di-handle oleh writeDoc. canalId & sta menentukan _id.
 */
export async function writeDepth(
  userId: string,
  payload: DepthPayload,
): Promise<void> {
  const doc: SyncDoc<DepthPayload> = {
    _id: depthDocId(payload.canalId, payload.sta),
    type: 'depth',
    payload,
    updatedAt: new Date().toISOString(),
  };
  await writeDoc(userId, doc as unknown as SyncDoc);
}
