/**
 * Client for the Chikwafu Express API (repo root `/server`).
 *
 * Contract implemented by server/routes:
 *   POST /api/auth/login              -> { token, ...user }        (public)
 *   GET  /api/auth/me                 -> user                      (Bearer)
 *   GET  /api/products                -> paginated product list    (public)
 *   GET  /api/products/facets         -> categories/brands/bounds  (public)
 *   GET  /api/products/:slug          -> full product              (public)
 *   POST /api/orders                  -> Order                     (public, re-priced server-side)
 *   GET  /api/orders/track            -> tracking view             (public, ref + phone)
 *   GET  /api/orders                  -> Order[]                   (Bearer, admin)
 *   GET  /api/orders/stats            -> dashboard stats           (Bearer, admin)
 *   PUT  /api/orders/:id/status       -> Order                     (Bearer, admin)
 *   POST /api/payments/zengapay/...   -> collection result         (public, rate-limited)
 *   POST /api/media/upload            -> { url }                   (Bearer, admin)
 *   POST /api/newsletter              -> { ok, message }           (public)
 *
 * Base URL resolution:
 *   1. VITE_API_URL when set (explicit cross-origin deployment), else
 *   2. same origin — the Express server also hosts the built storefront, so a
 *      single deployment needs no configuration;
 *   3. if neither answers on /api/health the app stays in demo mode against the
 *      local seeded store, which is what the static GitHub Pages build does.
 */

import { useSyncExternalStore } from 'react'

/**
 * Vite inlines `import.meta.env` at build time; it does not exist when this
 * module is imported by plain Node (the verification scripts, or the Express
 * server). Same guard as `lib/format.ts`: read it defensively and fall back to
 * "no configured API", which is the same state a Pages build with no
 * VITE_API_URL is in.
 */
const ENV = (import.meta as { env?: { VITE_API_URL?: string } }).env
const CONFIGURED: string = (ENV?.VITE_API_URL ?? '').replace(/\/$/, '')

export let API_URL: string = CONFIGURED
export let API_ENABLED: boolean = CONFIGURED.length > 0

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const subscribeApiState = (fn: () => void) => {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Reactive view of API_ENABLED — flips once same-origin detection resolves. */
export function useApiEnabled(): boolean {
  return useSyncExternalStore(
    subscribeApiState,
    () => API_ENABLED,
    () => CONFIGURED.length > 0,
  )
}

/* How long one `/api/health` probe may take, and how long we keep trying. */
const PROBE_TIMEOUT_MS = 4000
const RETRY_DELAYS_MS = [6_000, 15_000, 25_000]

/**
 * Resolves once, early in boot (see main.tsx). Same-origin detection lets the
 * Express-hosted build go live automatically while a static build keeps demo
 * mode.
 *
 * It resolves on the *first* probe so nothing waits on the network; any
 * remaining attempts run in the background.
 *
 * Free-tier API hosts put an idle service to sleep — Render takes 30-60 s to
 * wake one. A single probe at boot would therefore report "no API" on the first
 * visit of the day and leave the storefront in demo mode for the whole session,
 * even though the API answers a minute later. So a failed boot probe keeps
 * retrying with a widening gap (~50 s of trying in total) and flips the store
 * live the moment one answers — `useApiEnabled` subscribes, so the header,
 * checkout, tracking and the admin sign-in all pick it up without a reload.
 */
export const apiReady: Promise<boolean> = API_ENABLED
  ? Promise.resolve(true)
  : detectSameOriginApi()

async function detectSameOriginApi(): Promise<boolean> {
  const live = await probeApiHealth()
  if (!live) void retrySameOriginApi()
  return live
}

/** One attempt against `GET /api/health`. Exported so the checks can drive it. */
export async function probeApiHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return false
    const body = (await res.json()) as { name?: string }
    if (body?.name !== 'chikwafu-api') return false
    API_URL = ''
    API_ENABLED = true
    notify()
    return true
  } catch (err) {
    /* A sleeping host, an offline device and a CORS rejection are all normal
       here and must stay quiet. Anything else — a misconfiguration, a constant
       declared after its first use — is a bug, not a missing API, so say so
       instead of quietly reporting demo mode. */
    if (!(err instanceof TypeError) && !(err instanceof DOMException)) {
      console.error('[chikwafu] API probe failed unexpectedly', err)
    }
    notify()
    return false
  }
}

async function retrySameOriginApi(): Promise<void> {
  for (const delay of RETRY_DELAYS_MS) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    if (API_ENABLED) return
    if (await probeApiHealth()) {
      console.info('[chikwafu] live mode — the API woke up after detection had given up')
      return
    }
  }
}

const TOKEN_KEY = 'chikwafu-api-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_ENABLED) throw new ApiError(0, 'API is not configured')

  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Is the server running?')
  }

  const text = await res.text()
  const body = text ? (() => { try { return JSON.parse(text) } catch { return { message: text } } })() : {}

  if (!res.ok) {
    if (res.status === 401) setToken(null)
    throw new ApiError(res.status, body.message || `Request failed (${res.status})`)
  }
  return body as T
}

/* ─────────────── shapes returned by the Express API ─────────────── */

export interface ApiUser {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  token?: string
}

export interface ApiOrderItem {
  product: string
  name: string
  image: string
  price: number
  qty: number
  express?: boolean
}

export interface ApiOrder {
  _id: string
  ref?: string
  user?: { _id: string; name: string; email?: string } | string
  items: ApiOrderItem[]
  shippingAddress?: {
    fullName?: string; phone?: string; address?: string
    city?: string; region?: string; country?: string
  }
  paymentMethod?: string
  coupon?: string | null
  itemsPrice: number
  discount?: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  status: string
  isPaid?: boolean
  createdAt: string
}

export interface ApiStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  statusCounts: { _id: string; count: number }[]
}

export interface TrackView {
  ref: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  placedAt: string
  paymentMethod: string
  isPaid: boolean
  region: string
  town: string
  itemCount: number
  total: number
  express: boolean
  eta: string | null
  timeline: { key: string; label: string; at: string | null; done: boolean }[]
}

export interface NewOrderInput {
  items: { productId: string; qty: number }[]
  coupon?: string | null
  payment: 'mtn' | 'airtel' | 'card' | 'cod'
  /**
   * Which WhatsApp line took the order chat, from the Admin's presence toggle.
   * Agent-handled orders are ticketed back to the Admin once delivered.
   */
  handledBy?: 'admin' | 'agent'
  delivery: {
    fullName: string; phone: string; email?: string
    region: string; town?: string; address: string; notes?: string
  }
}

/* ─────────────────────────── endpoints ─────────────────────────── */

export const uploadMedia = async (file: File): Promise<{ url: string }> => {
  if (!API_ENABLED) throw new ApiError(0, 'Configure VITE_API_URL to upload media')
  const form = new FormData()
  form.append('file', file)
  const token = getToken()
  const res = await fetch(`${API_URL}/api/media/upload`, { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!res.ok) throw new ApiError(res.status, 'Image upload failed')
  return res.json()
}

export const api = {
  health: () => request<{ status: string; name: string }>('/api/health'),

  login: (email: string, password: string) =>
    request<ApiUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<ApiUser>('/api/auth/me'),

  orders: () => request<ApiOrder[]>('/api/orders'),

  stats: () => request<ApiStats>('/api/orders/stats'),

  setOrderStatus: (id: string, status: string) =>
    request<ApiOrder>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  /** Server-side order creation with server-computed pricing. */
  createOrder: (input: NewOrderInput) =>
    request<ApiOrder>('/api/orders', { method: 'POST', body: JSON.stringify(input) }),

  trackOrder: (ref: string, phone: string) =>
    request<TrackView>(`/api/orders/track?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`),

  subscribe: (email: string) =>
    request<{ ok: boolean; alreadySubscribed?: boolean; message: string }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Server-side ZengaPay collection. API keys must never be exposed in the browser. */
  createMobileMoneyCollection: (payload: {
    amount: number; currency: 'UGX'; phone: string; network: 'MTN' | 'AIRTEL';
    transactionReference: string; description?: string;
  }) => request<{ status?: string; transactionReference?: string; message?: string }>(
    '/api/payments/zengapay/collections', { method: 'POST', body: JSON.stringify(payload) },
  ),
}
