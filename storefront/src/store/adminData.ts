import { useCallback, useEffect, useState } from 'react'
import { API_ENABLED, ApiError, api, type ApiOrder } from '../lib/api'
import { useOrders, type Order, type OrderStatus } from './orders'

/**
 * Single source of truth for the admin screens.
 *
 * When VITE_API_URL is set the data comes from the Express API and status
 * changes are PUT back to it. Otherwise everything falls through to the local
 * seeded store, so the static GitHub Pages build still demonstrates fully.
 */

const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending', processing: 'processing', shipped: 'shipped',
  delivered: 'delivered', cancelled: 'cancelled', canceled: 'cancelled',
}

/** Normalise an API order into the shape the admin UI already renders. */
function adapt(o: ApiOrder): Order {
  const ship = o.shippingAddress ?? {}
  const user = typeof o.user === 'object' && o.user ? o.user : null
  return {
    ref: '#' + o._id.slice(-6).toUpperCase(),
    placedAt: o.createdAt,
    status: STATUS_MAP[String(o.status).toLowerCase()] ?? 'pending',
    customer: {
      name: ship.fullName || user?.name || 'Customer',
      phone: ship.phone || '—',
      email: user?.email,
    },
    destination: {
      region: ship.region || ship.country || '—',
      town: ship.city || '—',
      address: ship.address || '—',
    },
    payment: (o.paymentMethod as Order['payment']) ?? 'cod',
    items: o.items.map((l) => ({
      productId: l.product, name: l.name, qty: l.qty,
      unitPrice: l.price, lineTotal: l.price * l.qty,
    })),
    subtotal: o.itemsPrice ?? 0,
    discount: 0,
    delivery: o.shippingPrice ?? 0,
    total: o.totalPrice ?? 0,
    express: false,
    /** kept so status updates can address the real document */
    apiId: o._id,
  } as Order & { apiId: string }
}

export interface AdminData {
  orders: Order[]
  source: 'api' | 'demo'
  loading: boolean
  error: string | null
  refresh: () => void
  setStatus: (order: Order, status: OrderStatus) => Promise<void>
}

export function useAdminData(): AdminData {
  const localOrders = useOrders((s) => s.orders)
  const setLocalStatus = useOrders((s) => s.setStatus)

  const [remote, setRemote] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(API_ENABLED)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!API_ENABLED) return
    setLoading(true)
    setError(null)
    try {
      const list = await api.orders()
      setRemote(list.map(adapt))
    } catch (err) {
      const e = err as ApiError
      // Fall back to demo data rather than showing an empty dashboard.
      setError(e.message || 'Could not load orders from the API.')
      setRemote(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const usingApi = API_ENABLED && remote !== null
  const orders = usingApi ? remote : localOrders

  const setStatus = useCallback(
    async (order: Order, status: OrderStatus) => {
      const apiId = (order as Order & { apiId?: string }).apiId
      if (usingApi && apiId) {
        setRemote((cur) =>
          cur ? cur.map((o) => (o.ref === order.ref ? { ...o, status } : o)) : cur,
        )
        try {
          await api.setOrderStatus(apiId, status)
        } catch (err) {
          setError((err as ApiError).message || 'Could not update the order.')
          void load()
        }
        return
      }
      setLocalStatus(order.ref, status)
    },
    [usingApi, setLocalStatus, load],
  )

  return {
    orders,
    source: usingApi ? 'api' : 'demo',
    loading,
    error,
    refresh: load,
    setStatus,
  }
}
