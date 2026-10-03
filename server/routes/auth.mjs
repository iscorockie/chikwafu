/** POST /api/auth/login · GET /api/auth/me */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { ah, unauthorized, rateLimit, isEmail } from '../lib/http.mjs'
import { signToken, publicUser, requireAuth } from '../lib/auth.mjs'

export function authRoutes(store) {
  const r = Router()

  r.post(
    '/login',
    rateLimit({ windowMs: 60_000, max: 10, message: 'Too many sign-in attempts. Try again in a minute.' }),
    ah(async (req, res) => {
      const email = String(req.body?.email ?? '').trim().toLowerCase()
      const password = String(req.body?.password ?? '')
      if (!isEmail(email) || !password) throw unauthorized('Email and password are required.')

      const user = await store.users.byEmail(email)
      // Same message for unknown email and wrong password so responses don't leak accounts.
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        throw unauthorized('Wrong email or password.')
      }

      res.json({ ...publicUser(user), token: signToken(user) })
    }),
  )

  r.get(
    '/me',
    requireAuth,
    ah(async (req, res) => {
      const user = await store.users.byId(req.user.sub)
      if (!user) throw unauthorized('Account no longer exists.')
      res.json(publicUser(user))
    }),
  )

  return r
}
