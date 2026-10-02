/** POST /api/newsletter (public) · GET /api/newsletter (admin) */
import { Router } from 'express'
import { ah, badRequest, rateLimit, isEmail } from '../lib/http.mjs'
import { requireAdmin } from '../lib/auth.mjs'
import { oid } from '../lib/db.mjs'

export function newsletterRoutes(db) {
  const r = Router()

  r.post(
    '/',
    rateLimit({ windowMs: 60_000, max: 5, message: 'Too many sign-ups from this connection.' }),
    ah(async (req, res) => {
      const email = String(req.body?.email ?? '').trim().toLowerCase()
      if (!isEmail(email)) throw badRequest('Enter a valid email address.')
      const existing = db.state.newsletter.find((n) => n.email === email)
      if (!existing) {
        db.state.newsletter.unshift({ _id: oid(), email, at: new Date().toISOString() })
        db.save()
      }
      res.status(existing ? 200 : 201).json({
        ok: true,
        alreadySubscribed: !!existing,
        message: existing
          ? 'You’re already on the list — see you in your inbox.'
          : 'Subscribed. One email a month, nothing else.',
      })
    }),
  )

  r.get('/', requireAdmin, ah(async (_req, res) => {
    res.json(db.state.newsletter.slice(0, 500))
  }))

  return r
}
