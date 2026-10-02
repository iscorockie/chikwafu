/** Small HTTP helpers: error type, async wrapper, in-memory rate limiter. */

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const badRequest = (msg) => new HttpError(400, msg)
export const unauthorized = (msg = 'Authentication required') => new HttpError(401, msg)
export const forbidden = (msg = 'Not allowed') => new HttpError(403, msg)
export const notFound = (msg = 'Not found') => new HttpError(404, msg)

/** Express 4 does not catch rejected promises from async handlers. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/**
 * Fixed-window per-IP limiter. Keeps the public auth / payment endpoints from
 * being hammered; state is in-memory so a restart resets it (fine for a demo).
 */
export function rateLimit({ windowMs = 60_000, max = 20, message = 'Too many requests, slow down.' }) {
  const hits = new Map()
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
  }, windowMs).unref()

  return (req, res, next) => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs })
      return next()
    }
    entry.count += 1
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)))
      return next(new HttpError(429, message))
    }
    next()
  }
}

export const isEmail = (s) => typeof s === 'string' && /^\S+@\S+\.\S+$/.test(s)
export const isPhone = (s) => typeof s === 'string' && /^(\+?256|0)7\d{8}$/.test(s.replace(/\s/g, ''))
