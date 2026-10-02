/** JWT issuing + Express middleware for Bearer auth and the admin gate. */
import jwt from 'jsonwebtoken'
import { resolveJwtSecret, config } from './env.mjs'
import { unauthorized, forbidden } from './http.mjs'

const SECRET = resolveJwtSecret()

export const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role, name: user.name, email: user.email }, SECRET, {
    expiresIn: config.jwtExpiresIn,
    issuer: 'chikwafu-api',
  })

export const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
})

/** Attaches `req.user` when a valid Bearer token is present (never throws). */
export function attachUser(req, _res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET)
    } catch {
      req.user = null
    }
  }
  next()
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized())
  next()
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(unauthorized())
  if (req.user.role !== 'admin') return next(forbidden('Administrator access required'))
  next()
}
