/**
 * Auto-split kanal > 999m (DOMAIN.md poin 6).
 *
 * Kanal di-split di batas `segmentSize` (default 500m): segmen 1 = 500m, segmen 2 =
 * sisanya. STA sambungan di awal segmen ke-2 di-SKIP supaya tidak duplikat di output TXT.
 * Kanal <= 999m tidak di-split (kembalikan 1 segmen utuh).
 *
 * Sinkron persis dgn server/src/shared/domain/splitCanal.ts.
 */
import type { CanalSegment } from '../types';

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
