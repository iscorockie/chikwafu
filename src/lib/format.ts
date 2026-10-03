import type { SyntheticEvent } from 'react'

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

/**
 * Stand-in for a product photo that cannot be loaded — a device that is
 * offline, or one of the few listings whose photo lives on a supplier CDN and
 * has since gone away. Keeps the browser's broken-image icon off the grid.
 */
export const PHOTO_PLACEHOLDER = asset('/brand/photo-placeholder.svg')

export const onPhotoError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget
  if (img.dataset.placeholder === 'true') return // never loop on the fallback
  img.dataset.placeholder = 'true'
  img.src = PHOTO_PLACEHOLDER
}
