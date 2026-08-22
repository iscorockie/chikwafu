/**
 * Money formatting for the admin.
 *
 * Everything Chikwafu sells is priced in Ugandan shillings. UGX has no
 * subunit — there are no cents — so amounts are always whole numbers and
 * must never be rendered as "$1045000.00".
 */

export const UGX = (n) =>
  'UGX ' + new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

/** Compact form for stat cards and chart axes: UGX 2.5M, UGX 144k. */
export const UGXshort = (n) => {
  const v = Math.round(n || 0)
  if (v >= 1_000_000) return `UGX ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
  if (v >= 10_000) return `UGX ${Math.round(v / 1000)}k`
  return UGX(v)
}
