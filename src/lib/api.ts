/**
 * Client for the Chikwafu Express API (repo root `/server`).
 *
 * Contract taken from server/routes + server/controllers on `main`:
 *   POST /api/auth/login        -> { token, ...user }        (public)
 *   GET  /api/auth/me           -> user                      (Bearer)
 *   GET  /api/orders            -> Order[]                   (Bearer, admin)
 *   GET  /api/orders/stats      -> dashboard stats           (Bearer, admin)
 *   PUT  /api/orders/:id/status -> Order                     (Bearer, admin)
 *   GET  /api/products          -> products                  (public)
 *
 * The base URL comes from VITE_API_URL. When it is unset the app runs in
 * demo mode against the local seeded store — the storefront is deployed to
 * GitHub Pages, which is static, so there is no API to talk to there.
 */

export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const API_ENABLED = API_URL.length > 0

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
}

export interface ApiOrder {
  _id: string
  user?: { _id: string; name: string; email: string } | string
  items: ApiOrderItem[]
  shippingAddress?: {
    fullName?: string; phone?: string; address?: string
    city?: string; region?: string; country?: string
  }
  paymentMethod?: string
  itemsPrice: number
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

/* ─────────────────────────── endpoints ─────────────────────────── */

export const uploadToR2 = async (file: File): Promise<{ url: string }> => {
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

  /** Server-side ZengaPay collection. API keys must never be exposed in the browser. */
  createMobileMoneyCollection: (payload: {
    amount: number; currency: 'UGX'; phone: string; network: 'MTN' | 'AIRTEL';
    transactionReference: string; description?: string;
  }) => request<{ status?: string; transactionReference?: string; message?: string }>(
    '/api/payments/zengapay/collections', { method: 'POST', body: JSON.stringify(payload) },
  ),
}
