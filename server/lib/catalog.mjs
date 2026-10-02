/**
 * Product catalogue for the API.
 *
 * Loaded straight from the storefront source (`src/lib/catalog.ts`) using
 * Node's native TypeScript type-stripping, so the API and the UI can never
 * disagree about prices, stock or slugs. A search index and lookup maps are
 * built once at boot.
 */
import { products as ALL, CATEGORIES, brands, priceBounds, collections } from '../../src/lib/catalog.ts'

const byId = new Map(ALL.map((p) => [p.id, p]))
const bySlug = new Map(ALL.map((p) => [p.slug, p]))
const haystack = new Map(
  ALL.map((p) => [
    p.id,
    `${p.name} ${p.brand} ${p.category} ${p.tagline} ${p.description}`.toLowerCase(),
  ]),
)

/** What the grid needs — keeps list payloads ~20× smaller than full docs. */
export function slim(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    brand: p.brand,
    category: p.category,
    price: p.price,
    compareAt: p.compareAt ?? null,
    image: p.image,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    express: !!p.express,
    badges: p.badges ?? [],
  }
}

const SORTS = {
  featured: (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  name: (a, b) => a.name.localeCompare(b.name),
  newest: (a, b) => a.id.localeCompare(b.id),
}

/**
 * Filter + sort + paginate with the same semantics as the storefront's
 * Shop page, so the two surfaces stay interchangeable.
 */
export function queryProducts(params = {}) {
  const {
    q = '', category = '', brand = '', sort = 'featured',
    rating = 0, max = priceBounds.max, deals = false, stock = false, express = false,
  } = params
  const page = Math.max(1, Number(params.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 24))
  const terms = String(q).toLowerCase().split(/\s+/).filter(Boolean)

  let list = ALL.filter((p) => {
    if (category && p.category !== category) return false
    if (brand && p.brand !== brand) return false
    if (p.price > Number(max)) return false
    if (Number(rating) && p.rating < Number(rating)) return false
    if (deals && !p.compareAt) return false
    if (stock && p.stock <= 0) return false
    if (express && !p.express) return false
    if (terms.length) {
      const hay = haystack.get(p.id)
      if (!terms.every((t) => hay.includes(t))) return false
    }
    return true
  })

  list = [...list].sort(SORTS[sort] ?? SORTS.featured)
  const total = list.length
  const pages = Math.max(1, Math.ceil(total / limit))
  const items = list.slice((page - 1) * limit, page * limit)
  return { items: items.map(slim), total, page, pages, limit }
}

export const getProductBySlug = (slug) => bySlug.get(slug) ?? null
export const getProductById = (id) => byId.get(id) ?? null
export const productCount = () => ALL.length

export const facets = () => ({
  categories: [...CATEGORIES],
  brands: [...brands],
  priceBounds,
  collections: collections.map((c) => ({ slug: c.slug, title: c.title, category: c.category })),
  expressCount: ALL.filter((p) => p.express).length,
})
