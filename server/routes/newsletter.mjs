/** POST /api/newsletter (public) · GET /api/newsletter (admin) */
import { Router } from 'express'
import { ah, badRequest, rateLimit, isEmail } from '../lib/http.mjs'
import { requireAdmin } from '../lib/auth.mjs'
import { oid } from '../lib/store.mjs'
import { subscribeCampaigns, zoho } from '../lib/zoho.mjs'

export function newsletterRoutes(store) {
  const r = Router()

  r.post(
    '/',
    rateLimit({ windowMs: 60_000, max: 5, message: 'Too many sign-ups from this connection.' }),
    ah(async (req, res) => {
      const email = String(req.body?.email ?? '').trim().toLowerCase()
      if (!isEmail(email)) throw badRequest('Enter a valid email address.')
      const existing = await store.newsletter.byEmail(email)
      if (!existing) {
        const entry = { _id: oid(), email, at: new Date().toISOString() }
        await store.newsletter.insert(entry)
        // Mirror into Zoho Campaigns so the list is actually mailable. A
        // failure here must not cost us the sign-up — it stays in our ledger.
        const synced = await subscribeCampaigns(email)
        if (synced.ok) await store.newsletter.markSynced(entry._id)
      }
      res.status(existing ? 200 : 201).json({
        ok: true,
        alreadySubscribed: !!existing,
        mailingList: zoho.campaigns ? 'zoho-campaigns' : 'local',
        message: existing
          ? 'You’re already on the list — see you in your inbox.'
          : 'Subscribed. One email a month, nothing else.',
      })
    }),
  )

  r.get('/', requireAdmin, ah(async (_req, res) => {
    res.json(await store.newsletter.list(500))
  }))

  return r
}
