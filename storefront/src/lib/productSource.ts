import { useEffect, useState } from 'react'
import { API_ENABLED, API_URL } from './api'
import { products as bundled } from './catalog'
import type { Product } from './types'

/**
 * Where the storefront gets its products.
 *
 * The Express API is the source of truth for the things that change —
 * price, stock, rating, availability. It does NOT carry the editorial
 * content the product pages render: tagline, specs, highlights, gallery
 * angles, written reviews. Those live in the bundled catalogue.
 *
 * So we merge rather than replace. A live product is matched to its
 * bundled twin by slug (falling back to name) and the two are combined:
 * commercial fields from the API, editorial fields from the bundle.
 *
 * If the API is unreachable — unset, offline, or asleep on Render's free
 * tier — the bundled catalogue is served unchanged. The shop always works.
 */

interface ApiProduct {
  _id: string
  name: string
  slug?: string
  brand?: string
  description?: string
  category?: { name?: string } | string
  images?: string[]
  price: number
  compareAtPrice?: number
  stock?: number
  tags?: string[]
  isFeatured?: boolean
  isNewArrival?: boolean
  rating?: number
  numReviews?: number
  isActive?: boolean
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Bundled products indexed by normalised name.
 *
 * Slugs cannot be used to match: the Product model appends a random suffix
 * on save (`...-q4i2s`), so an API slug never equals its bundled one and
 * changes on every reseed. Names are stable and match 78/78 today.
 */
const byName = new Map(bundled.map((p) => [norm(p.name), p]))

const findBundled = (api: ApiProduct): Product | undefined => byName.get(norm(api.name))

/**
 * Combine one API record with its bundled counterpart.
 * Commercial data wins from the API; editorial data from the bundle.
 */
function merge(api: ApiProduct): Product {
  const base = findBundled(api)
  const categoryName =
    typeof api.category === 'string' ? api.category : api.category?.name

  if (!base) {
    // A product added in the admin with no bundled twin. Render what we can
    // rather than dropping it — missing editorial sections degrade quietly.
    return {
      id: api._id,
      slug: norm(api.name).replace(/\s+/g, '-'),
      name: api.name,
      tagline: '',
      brand: api.brand || '',
      category: (categoryName as Product['category']) ?? 'Kitchen',
      price: api.price,
      compareAt: api.compareAtPrice && api.compareAtPrice > api.price ? api.compareAtPrice : undefined,
      image: api.images?.[0] || '',
      gallery: [{ label: 'Front', zoom: 1, pos: '50% 50%' }],
      badges: api.isNewArrival ? ['New'] : [],
      rating: api.rating ?? 0,
      reviewCount: api.numReviews ?? 0,
      stock: api.stock ?? 0,
      warrantyMonths: 12,
      colour: '',
      description: api.description || '',
      highlights: [],
      specs: [],
      reviews: [],
      express: api.tags?.some((t) => t.toLowerCase() === 'express') ?? false,
      featured: api.isFeatured,
    }
  }

  return {
    ...base,
    // `slug` deliberately keeps the bundled value: the API's slug carries a
    // random suffix that changes on every reseed, which would break links.
    // live commercial state
    id: api._id,
    price: api.price,
    compareAt:
      api.compareAtPrice && api.compareAtPrice > api.price ? api.compareAtPrice : base.compareAt,
    stock: api.stock ?? base.stock,
    rating: api.rating ?? base.rating,
    reviewCount: api.numReviews ?? base.reviewCount,
    featured: api.isFeatured ?? base.featured,
    // prefer an API image only if one was actually set
    image: api.images?.[0] || base.image,
    description: api.description || base.description,
  }
}

export type ProductSource = 'api' | 'bundled'

/** Why the bundled catalogue is being served instead of live data. */
export type FallbackReason =
  | 'not-configured'   // VITE_API_URL unset — expected on a static host
  | 'cors'             // the API refused this origin: CLIENT_URL is wrong
  | 'unreachable'      // network error, DNS, or the free instance is asleep
  | 'http-error'       // the API answered, but not with 200
  | 'empty'            // the API answered with no products
  | null               // live data in use

export interface CatalogueState {
  products: Product[]
  source: ProductSource
  loading: boolean
  reason: FallbackReason
}

let cache: { products: Product[]; source: ProductSource; reason: FallbackReason } | null = null
let inflight: Promise<void> | null = null

/**
 * Falling back is safe for shoppers but dangerous for operators: the shop
 * looks perfectly normal while nothing the admin changes reaches it. So the
 * reason is always recorded, logged, and — for a misconfiguration rather
 * than a blip — shown on screen.
 */
function fallback(reason: Exclude<FallbackReason, null>, detail?: string) {
  cache = { products: bundled, source: 'bundled', reason }

  if (reason === 'not-configured') return // static build; nothing is wrong

  const advice: Record<string, string> = {
    cors:
      `The API refused requests from ${window.location.origin}. Add this origin to ` +
      "CLIENT_URL on the API service (it accepts a comma-separated list) and redeploy.",
    unreachable:
      `Could not reach ${API_URL}. It may be asleep, down, or blocked by DNS.`,
    'http-error': `${API_URL} responded with an error${detail ? ` (${detail})` : ''}.`,
    empty: `${API_URL} returned no products. Has the database been seeded?`,
  }

  console.error(
    `[Chikwafu] Showing the built-in catalogue instead of live data.\n` +
    `  Reason: ${reason}\n  ${advice[reason]}\n` +
    "  Prices and stock on this page may be out of date, and admin changes will not appear.",
  )
}

async function load() {
  if (!API_ENABLED) {
    fallback('not-configured')
    return
  }
  try {
    const res = await fetch(`${API_URL}/api/products?limit=500`, {
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      fallback('http-error', `HTTP ${res.status}`)
      return
    }
    const body = await res.json()
    const list: ApiProduct[] = Array.isArray(body) ? body : body.products ?? []
    const live = list.filter((p) => p.isActive !== false).map(merge)
    if (!live.length) {
      // An empty database should not empty the shop.
      fallback('empty')
      return
    }
    cache = { products: live, source: 'api', reason: null }
  } catch (err) {
    // A blocked cross-origin request surfaces as an opaque TypeError with no
    // status, which is exactly how a wrong CLIENT_URL presents.
    const isAbort = err instanceof DOMException && err.name === 'TimeoutError'
    fallback(isAbort ? 'unreachable' : 'cors')
  }
}

/**
 * Read the catalogue. Renders the bundled list immediately so there is never
 * a blank shop, then swaps in live data once it arrives.
 */
export function useCatalogue(): CatalogueState {
  const [state, setState] = useState<CatalogueState>(() =>
    cache
      ? { ...cache, loading: false }
      : { products: bundled, source: 'bundled', reason: null, loading: API_ENABLED },
  )

  useEffect(() => {
    if (cache) {
      setState({ ...cache, loading: false })
      return
    }
    let alive = true
    inflight = inflight ?? load()
    inflight.then(() => {
      inflight = null
      if (alive && cache) setState({ ...cache, loading: false })
    })
    return () => { alive = false }
  }, [])

  return state
}

/** Look a product up by slug from whichever catalogue is in play. */
export function useProduct(slug: string) {
  const { products, loading } = useCatalogue()
  return { product: products.find((p) => p.slug === slug), loading }
}
