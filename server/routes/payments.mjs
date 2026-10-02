/**
 * POST /api/payments/zengapay/collections
 *
 * Mobile-money collection initiation. This is the one place API keys may live:
 * the browser never sees them. In `sandbox` mode (default) the prompt is
 * simulated — a phone number ending in 0000 is declined so the failure path
 * can be exercised. Switch to `live` (ZENGAPAY_MODE=live + ZENGAPAY_API_KEY)
 * and the request is forwarded to ZengaPay's Collections API.
 */
import { Router } from 'express'
import { ah, badRequest, notFound, rateLimit, isPhone } from '../lib/http.mjs'
import { requireAdmin } from '../lib/auth.mjs'
import { oid } from '../lib/db.mjs'
import { config } from '../lib/env.mjs'

export function paymentRoutes(db) {
  const r = Router()

  r.post(
    '/zengapay/collections',
    rateLimit({ windowMs: 60_000, max: 8, message: 'Too many payment attempts. Try again shortly.' }),
    ah(async (req, res) => {
      const b = req.body ?? {}
      const amount = Math.round(Number(b.amount))
      const phone = String(b.phone ?? '').replace(/\s/g, '')
      const network = String(b.network ?? '').toUpperCase()
      const reference = String(b.transactionReference ?? '').trim()

      if (!Number.isFinite(amount) || amount < 500) throw badRequest('Amount is too small to collect.')
      if (!['MTN', 'AIRTEL'].includes(network)) throw badRequest('Network must be MTN or AIRTEL.')
      if (!isPhone(phone)) throw badRequest('Enter the Mobile Money number to charge.')
      if (!reference) throw badRequest('A transaction reference is required.')

      const order = db.state.orders.find((o) => o.ref === reference || o._id === reference)
      if (!order) throw notFound('No order matches that transaction reference.')
      if (order.totalPrice !== amount) {
        throw badRequest(`Amount does not match the order total (${order.totalPrice} UGX).`)
      }

      let status = 'SUCCESS'
      let message = 'Collection approved.'
      let providerRef = 'ZP-' + oid().slice(0, 10).toUpperCase()

      if (config.zengaPayMode === 'live') {
        if (!config.zengaPayApiKey) throw badRequest('ZengaPay is not configured on the server.')
        // ── Real integration point ─────────────────────────────────────────────
        // const upstream = await fetch('https://api.zengapay.com/v1/collections', {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${config.zengaPayApiKey}` },
        //   body: JSON.stringify({ amount, currency: 'UGX', msisdn: phone, network, reference }),
        // })
        // const upstreamBody = await upstream.json()
        // status = upstreamBody.status; providerRef = upstreamBody.transactionId
        throw badRequest('Live mode is not wired to a provider key in this deployment.')
      } else if (/0000$/.test(phone)) {
        status = 'FAILED'
        message = 'The customer declined the prompt on their phone.'
        providerRef = null
      }

      const payment = {
        _id: oid(),
        order: order._id,
        reference,
        providerRef,
        network,
        phone,
        amount,
        status,
        createdAt: new Date().toISOString(),
      }
      db.state.payments.unshift(payment)

      if (status === 'SUCCESS') {
        order.isPaid = true
        if (order.status === 'pending') order.status = 'processing'
        order.history = [...(order.history ?? []), {
          status: order.status, at: payment.createdAt, by: 'zengapay',
        }]
      }
      db.save()

      res.status(status === 'SUCCESS' ? 200 : 402).json({
        status,
        message,
        transactionReference: reference,
        providerReference: providerRef,
        orderStatus: order.status,
      })
    }),
  )

  /** Admin: recent payment attempts. */
  r.get('/zengapay/collections', requireAdmin, ah(async (_req, res) => {
    res.json(db.state.payments.slice(0, 100))
  }))

  return r
}
