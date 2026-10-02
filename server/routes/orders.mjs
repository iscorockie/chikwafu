/**
 * Orders.
 *
 * Public:  POST /api/orders            — place an order (server re-prices everything)
 *          GET  /api/orders/track      — customer tracking by reference + phone
 * Admin:   GET  /api/orders            — full ledger
 *          GET  /api/orders/stats      — dashboard aggregates
 *          PUT  /api/orders/:id/status — advance/cancel an order
 */
import { Router } from 'express'
import { ah, badRequest, notFound, rateLimit, isPhone } from '../lib/http.mjs'
import { requireAdmin } from '../lib/auth.mjs'
import { oid } from '../lib/db.mjs'
import { getProductById, productCount, slim } from '../lib/catalog.mjs'

/** Mirrors src/store/cart.ts so server and client always agree. */
export const COUPONS = {
  KARIBU10: { off: 0.1, label: '10% welcome discount' },
  CHIKWAFU5: { off: 0.05, label: '5% loyalty discount' },
}
export const FREE_DELIVERY_THRESHOLD = 1_500_000
export const DELIVERY_KAMPALA = 15000
export const DELIVERY_UPCOUNTRY = 45000
const CENTRAL = ['Kampala', 'Wakiso', 'Mukono']

export const deliveryFeeFor = (region, subtotal) => {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
  return CENTRAL.includes(region) ? DELIVERY_KAMPALA : DELIVERY_UPCOUNTRY
}

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const normalizePhone = (p) => {
  const d = String(p).replace(/\s/g, '')
  return d.startsWith('+256') ? '0' + d.slice(4) : d
}

/** Public, minimal view used by the tracking page. */
function trackView(o) {
  const placed = new Date(o.createdAt)
  const region = o.shippingAddress?.region ?? ''
  const days = o.status === 'delivered' ? 0 : CENTRAL.includes(region) ? 1 : region ? 4 : 2
  const eta = new Date(placed.getTime() + days * 86400000)
  const step = STATUSES.indexOf(o.status)
  return {
    ref: o.ref,
    status: o.status,
    placedAt: o.createdAt,
    paymentMethod: o.paymentMethod,
    isPaid: !!o.isPaid,
    region,
    town: o.shippingAddress?.city ?? '',
    itemCount: o.items.reduce((s, l) => s + l.qty, 0),
    total: o.totalPrice,
    express: o.items.some((l) => l.express),
    eta: o.status === 'cancelled' ? null : eta.toISOString(),
    timeline: [
      { key: 'pending', label: 'Order placed', at: o.createdAt, done: step >= 0 && o.status !== 'cancelled' },
      { key: 'processing', label: 'Processing at Ntinda', at: null, done: step >= 1 },
      { key: 'shipped', label: 'With our rider', at: null, done: step >= 2 },
      {
        key: 'delivered',
        label: o.status === 'cancelled' ? 'Cancelled' : 'Delivered',
        at: null,
        done: o.status === 'delivered' || o.status === 'cancelled',
      },
    ],
  }
}

export function orderRoutes(db) {
  const r = Router()

  /* ─────────────────────────── public: place an order ─────────────────────────── */
  r.post(
    '/',
    rateLimit({ windowMs: 60_000, max: 12, message: 'Too many order attempts. Please slow down.' }),
    ah(async (req, res) => {
      const body = req.body ?? {}
      const lines = Array.isArray(body.items) ? body.items : []
      if (!lines.length) throw badRequest('Your cart is empty.')

      const d = body.delivery ?? {}
      if (String(d.fullName ?? '').trim().length < 3) throw badRequest('Enter the recipient’s full name.')
      if (!isPhone(d.phone)) throw badRequest('Enter a valid Ugandan phone number (07XX XXX XXX).')
      if (String(d.address ?? '').trim().length < 6) throw badRequest('Add a street, plot or landmark.')
      if (!CENTRAL.includes(d.region) && !['Jinja', 'Entebbe', 'Mbarara', 'Gulu', 'Mbale', 'Masaka', 'Lira', 'Fort Portal', 'Arua', 'Soroti', 'Kabale'].includes(d.region)) {
        throw badRequest('Choose a delivery district.')
      }
      const payment = ['mtn', 'airtel', 'card', 'cod'].includes(body.payment) ? body.payment : null
      if (!payment) throw badRequest('Choose a payment method.')
      if (payment === 'cod' && !CENTRAL.includes(d.region)) {
        throw badRequest('Cash on delivery is only available in Kampala, Wakiso and Mukono.')
      }

      // Re-price server-side: never trust amounts that arrive from the browser.
      const items = []
      for (const line of lines) {
        const p = getProductById(String(line.productId ?? ''))
        if (!p) throw badRequest('One of the items is no longer in the catalogue.')
        const qty = Math.floor(Number(line.qty))
        if (!Number.isFinite(qty) || qty < 1) throw badRequest('Invalid quantity.')
        if (qty > p.stock) throw badRequest(`Only ${p.stock} left of ${p.name}.`)
        const existing = items.find((x) => x.product === p.id)
        if (existing) existing.qty = Math.min(existing.qty + qty, p.stock)
        else {
          const s = slim(p)
          items.push({ product: p.id, name: s.name, image: s.image, price: s.price, qty, express: s.express })
        }
      }

      const couponKey = String(body.coupon ?? '').trim().toUpperCase()
      const coupon = COUPONS[couponKey] ? couponKey : null
      const itemsPrice = items.reduce((s, l) => s + l.price * l.qty, 0)
      const discount = coupon ? Math.round(itemsPrice * COUPONS[coupon].off) : 0
      const shippingPrice = deliveryFeeFor(d.region, itemsPrice - discount)
      const totalPrice = itemsPrice - discount + shippingPrice

      const now = new Date()
      const order = {
        _id: oid(),
        ref: 'CHK-' + now.getTime().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 90 + 10),
        user: { _id: 'guest', name: d.fullName.trim(), email: d.email || undefined },
        items,
        shippingAddress: {
          fullName: d.fullName.trim(),
          phone: normalizePhone(d.phone),
          address: d.address.trim(),
          city: d.town || '',
          region: d.region,
          country: 'Uganda',
          notes: d.notes || undefined,
        },
        paymentMethod: payment,
        coupon,
        itemsPrice,
        discount,
        shippingPrice,
        taxPrice: 0,
        totalPrice,
        status: 'pending',
        isPaid: false,
        createdAt: now.toISOString(),
        history: [{ status: 'pending', at: now.toISOString(), by: 'storefront' }],
      }

      db.state.orders.unshift(order)
      db.save()
      res.status(201).json(order)
    }),
  )

  /* ─────────────────────────── public: track an order ─────────────────────────── */
  r.get(
    '/track',
    rateLimit({ windowMs: 60_000, max: 30 }),
    ah(async (req, res) => {
      const ref = String(req.query.ref ?? '').trim().toUpperCase()
      const phone = normalizePhone(req.query.phone ?? '')
      if (!ref || !phone) throw badRequest('Enter your order reference and phone number.')
      const order = db.state.orders.find(
        (o) => o.ref.toUpperCase() === ref && normalizePhone(o.shippingAddress?.phone ?? '') === phone,
      )
      if (!order) throw notFound('We couldn’t find an order with that reference and phone number.')
      res.json(trackView(order))
    }),
  )

  /* ─────────────────────────────── admin: ledger ─────────────────────────────── */
  r.get('/stats', requireAdmin, ah(async (_req, res) => {
    const orders = db.state.orders
    const live = orders.filter((o) => o.status !== 'cancelled')
    res.json({
      totalOrders: orders.length,
      totalRevenue: live.reduce((s, o) => s + o.totalPrice, 0),
      totalProducts: productCount(),
      statusCounts: STATUSES.map((s) => ({
        _id: s,
        count: orders.filter((o) => o.status === s).length,
      })),
    })
  }))

  r.get('/', requireAdmin, ah(async (req, res) => {
    const status = String(req.query.status ?? '')
    let list = db.state.orders
    if (status && STATUSES.includes(status)) list = list.filter((o) => o.status === status)
    const limit = Math.min(500, Number(req.query.limit) || 200)
    res.json(list.slice(0, limit))
  }))

  r.get('/:id', requireAdmin, ah(async (req, res) => {
    const order = db.state.orders.find((o) => o._id === req.params.id || o.ref === req.params.id)
    if (!order) throw notFound('Order not found.')
    res.json(order)
  }))

  r.put('/:id/status', requireAdmin, ah(async (req, res) => {
    const status = String(req.body?.status ?? '').toLowerCase()
    if (!STATUSES.includes(status)) throw badRequest(`Unknown status “${status}".`)
    const order = db.state.orders.find((o) => o._id === req.params.id)
    if (!order) throw notFound('Order not found.')

    order.status = status
    order.isPaid = status !== 'pending' && status !== 'cancelled' ? true : order.isPaid
    order.history = [...(order.history ?? []), {
      status, at: new Date().toISOString(), by: req.user.email ?? 'admin',
    }]
    db.save()
    res.json(order)
  }))

  return r
}
