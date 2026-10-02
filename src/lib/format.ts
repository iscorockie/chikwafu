export const UGX = (n: number) =>
  'UGX ' + new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.round(n))

export const UGXshort = (n: number) =>
  n >= 1_000_000 ? `UGX ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : UGX(n)

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ')

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/**
 * Resolve a public-folder asset against Vite's base URL (needed for GitHub Pages subpaths).
 *
 * `import.meta.env` only exists inside a Vite bundle. The catalogue is also
 * imported directly by the Express API in `server/` (plain Node), where it is
 * undefined — fall back to '/' so both worlds agree on absolute asset URLs.
 */
const BASE_URL: string =
  (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'

export const asset = (path: string) =>
  `${BASE_URL}${path.replace(/^\//, '')}`.replace(/([^:]\/)\/+/g, '$1')
