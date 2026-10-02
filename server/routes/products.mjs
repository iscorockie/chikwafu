/** GET /api/products · GET /api/products/facets · GET /api/products/:slug */
import { Router } from 'express'
import { ah, notFound } from '../lib/http.mjs'
import { queryProducts, getProductBySlug, facets, productCount } from '../lib/catalog.mjs'

export function productRoutes() {
  const r = Router()

  r.get('/facets', ah(async (_req, res) => {
    res.json({ ...facets(), total: productCount() })
  }))

  r.get('/', ah(async (req, res) => {
    const bool = (v) => v === '1' || v === 'true'
    const result = queryProducts({
      q: req.query.q ?? '',
      category: req.query.category ?? '',
      brand: req.query.brand ?? '',
      sort: req.query.sort ?? 'featured',
      rating: Number(req.query.rating ?? 0),
      max: req.query.max ?? undefined,
      deals: bool(req.query.deals),
      stock: bool(req.query.stock),
      express: bool(req.query.express),
      page: req.query.page,
      limit: req.query.limit,
    })
    res.json(result)
  }))

  r.get('/:slug', ah(async (req, res) => {
    const p = getProductBySlug(req.params.slug)
    if (!p) throw notFound(`No product with slug “${req.params.slug}”.`)
    res.json(p)
  }))

  return r
}
