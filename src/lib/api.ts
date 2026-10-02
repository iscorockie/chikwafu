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

const CONFIGURED: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

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

/**
 * Resolves once, early in boot (see main.tsx). Same-origin detection lets the
 * Express-hosted build go live automatically while GitHub Pages keeps demo mode.
 */
export const apiReady: Promise<boolean> = API_ENABLED
  ? Promise.resolve(true)
  : detectSameOriginApi()

async function detectSameOriginApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', {
      signal: AbortSignal.timeout(2500),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return false
    const body = (await res.json()) as { name?: string }
    if (body?.name !== 'chikwafu-api') return false
    API_URL = ''
    API_ENABLED = true
    notify()
    return true
  } catch {
    notify()
    return false
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
