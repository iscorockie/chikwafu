export const UGX = (n: number) =>
  'UGX ' + new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.round(n))

export const UGXshort = (n: number) =>
  n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : UGX(n)

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ')

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
