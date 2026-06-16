/**
 * Contractor short name untuk header chart export (DOMAIN.md poin 8).
 * mis. "PT CIPTA BUANA SAMUDRA" → "PT. CBS".
 *
 * Port logic dari demo/app.js `shortName()`. Fallback: "PT. " + inisial tiap kata
 * SETELAH kata pertama (skip prefix "PT").
 *
 * Sinkron persis dgn client/src/shared/domain/shortName.ts.
 */

/** Mapping eksplisit kontraktor yang sudah dikenal (DOMAIN.md poin 8). */
export const CONTRACTOR_SHORT_NAMES: Record<string, string> = {
  'PT CIPTA BUANA SAMUDRA': 'PT. CBS',
  'PT PUTRA RIMBA NUSANTARA': 'PT. PRN',
  'PT MUSI NAULI LESTARI': 'PT. MNL',
  'PT SUMBER HIJAU PERMAI': 'PT. SHP',
};

export function shortName(fullName: string): string {
  const known = CONTRACTOR_SHORT_NAMES[fullName];
  if (known) return known;
  const initials = fullName
    .split(' ')
    .slice(1)
    .map((w) => w[0] ?? '')
    .join('');
  return 'PT. ' + initials;
}
