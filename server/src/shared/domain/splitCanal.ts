/**
 * Auto-split kanal > 999m (DOMAIN.md poin 6).
 *
 * Kanal di-split di batas `segmentSize` (default 500m): segmen 1 = 500m, segmen 2 =
 * sisanya. STA sambungan di awal segmen ke-2 di-SKIP supaya tidak duplikat di output TXT.
 *
 * Contoh (DOMAIN.md poin 6): panjang 1200m, segmentSize 500:
 *   Segmen 1: STA 0   -> 500   (length 500, skipFirstSta=false)
 *   Segmen 2: STA 500 -> 1200  (length 700, skipFirstSta=true)
 *
 * Kanal <= 999m tidak di-split: kembalikan 1 segmen utuh.
 *
 * Sinkron persis dgn client/src/shared/domain/splitCanal.ts.
 */
import type { CanalSegment } from '../types.js';

export function splitCanal(totalLength: number, segmentSize = 500): CanalSegment[] {
  if (totalLength <= 999 || segmentSize <= 0 || segmentSize >= totalLength) {
    return [{ staStart: 0, staEnd: totalLength, length: totalLength, skipFirstSta: false }];
  }

  return [
    { staStart: 0, staEnd: segmentSize, length: segmentSize, skipFirstSta: false },
    {
      staStart: segmentSize,
      staEnd: totalLength,
      length: totalLength - segmentSize,
      skipFirstSta: true,
    },
  ];
}
