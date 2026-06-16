/**
 * Builder path update Mongo untuk schema nested `Data > canal_data[] > data[]`.
 *
 * Diekstrak jadi fungsi murni supaya pola polymorphic `:id` (positional `$` +
 * arrayFilters) bisa diuji TANPA DB. Service memakai builder ini; test memverifikasi
 * bentuk `$set`/arrayFilters persis (regresi: salah path = data nyasar).
 */

/** $set untuk update field 1 segmen via positional `$` (filter di query: canal_data._id). */
export function segmentSet(
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const $set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) $set[`canal_data.$.${k}`] = v;
  return $set;
}

/** $set untuk update field 1 titik kedalaman via arrayFilters [seg][pt]. */
export function pointSet(
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const $set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    $set[`canal_data.$[seg].data.$[pt].${k}`] = v;
  }
  return $set;
}

/** arrayFilters untuk target 1 titik by data._id (dipakai update/delete point). */
export function pointFiltersById(pointId: string): Record<string, unknown>[] {
  return [{ 'seg.data._id': pointId }, { 'pt._id': pointId }];
}

/** arrayFilters untuk target 1 titik by sta dalam segmen tertentu (dipakai drag-by-sta). */
export function pointFiltersBySta(
  segmentId: string,
  sta: number,
): Record<string, unknown>[] {
  return [{ 'seg._id': segmentId }, { 'pt.sta': sta }];
}
