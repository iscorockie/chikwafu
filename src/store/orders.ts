import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { products } from '../lib/catalog'
import type { PaymentMethod } from '../lib/types'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  ref: string
  placedAt: string
  status: OrderStatus
  customer: { name: string; phone: string; email?: string }
  destination: { region: string; town: string; address: string }
  payment: PaymentMethod
  items: OrderItem[]
  subtotal: number
  discount: number
  delivery: number
  total: number
  express: boolean
  /**
   * Who took the order chat at the moment the client sent it in.
   * 'admin' — Admin WhatsApp (+256 780 844098) was online; direct chat.
   * 'agent' — Admin was offline, so the order was posted to the
   *           "Chikwafu Orders" group chat and the Agent
   *           (+256 786 028027) joined it — as an agent only.
   * Agent-handled orders are ticketed to the Admin once delivered.
   */
  handledBy?: 'admin' | 'agent'
  /** present when the order came from the Express API */
  apiId?: string
}

export const STATUS_FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']

export const STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: 'Pending', tone: 'bg-amber-400/15 text-amber-300 border-amber-400/30' },
  processing: { label: 'Processing', tone: 'bg-sky-400/15 text-sky-300 border-sky-400/30' },
  shipped: { label: 'Shipped', tone: 'bg-violet-400/15 text-violet-300 border-violet-400/30' },
  delivered: { label: 'Delivered', tone: 'bg-accent/15 text-accent border-accent/30' },
  cancelled: { label: 'Cancelled', tone: 'bg-danger/15 text-danger border-danger/30' },
}

/* ─── deterministic demo seed so the dashboard is never empty ─── */

const NAMES = [
  ['Sarah Nakato', 'Ntinda', 'Kampala'], ['Emmanuel Okello', 'Layibi', 'Gulu'],
  ['Aisha Namuli', 'Kira', 'Wakiso'], ['Denis Ssebugwawo', 'Nyendo', 'Masaka'],
  ['Grace Atim', 'Bugolobi', 'Kampala'], ['Ronald Kiggundu', 'Kitoro', 'Entebbe'],
  ['Miriam Achieng', 'Walukuba', 'Jinja'], ['Patience Tumusiime', 'Kakoba', 'Mbarara'],
  ['Julius Wanyama', 'Namatala', 'Mbale'], ['Catherine Nabbosa', 'Kyanja', 'Kampala'],
  ['Peter Odhiambo', 'Nakawa', 'Kampala'], ['Sylvia Kemigisha', 'Ishaka', 'Bushenyi'],
  ['Hassan Mubiru', 'Kabalagala', 'Kampala'], ['Josephine Adongo', 'Adyel', 'Lira'],
  ['Tom Byaruhanga', 'Kabundaire', 'Fort Portal'], ['Brenda Kyomuhendo', 'Naalya', 'Wakiso'],
  ['Charles Ojok', 'Ewuata', 'Arua'], ['Winnie Amongin', 'Soroti Central', 'Soroti'],
  ['Ivan Muwanga', 'Kansanga', 'Kampala'], ['Rehema Nassuna', 'Nansana', 'Wakiso'],
  ['Moses Kirya', 'Iganga Central', 'Iganga'], ['Esther Nagawa', 'Kawuku', 'Wakiso'],
  ['Fred Lubega', 'Makindye', 'Kampala'], ['Doreen Kabuye', 'Seeta', 'Mukono'],
]
const PAYMENTS: PaymentMethod[] = ['mtn', 'mtn', 'mtn', 'airtel', 'airtel', 'cod']

/** Small deterministic PRNG so the seed is identical on every load. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function seedOrders(): Order[] {
  const rand = rng(20260822)
  const out: Order[] = []
  const now = Date.now()

  for (let i = 0; i < 34; i++) {
    const [name, town, region] = NAMES[Math.floor(rand() * NAMES.length)]
    const daysAgo = Math.floor(rand() * 45)
    const placed = new Date(now - daysAgo * 86400000 - Math.floor(rand() * 86400000))

    const lineCount = 1 + Math.floor(rand() * 3)
    const items: OrderItem[] = []
    for (let k = 0; k < lineCount; k++) {
      const p = products[Math.floor(rand() * products.length)]
      if (items.some((x) => x.productId === p.id)) continue
      const qty = 1 + (rand() > 0.82 ? 1 : 0)
      items.push({
        productId: p.id, name: p.name, qty,
        unitPrice: p.price, lineTotal: p.price * qty,
      })
    }
    if (!items.length) continue

    const subtotal = items.reduce((s, l) => s + l.lineTotal, 0)
    const discount = rand() > 0.78 ? Math.round(subtotal * 0.1) : 0
    const central = ['Kampala', 'Wakiso', 'Mukono'].includes(region)
    const delivery = subtotal - discount >= 1_500_000 ? 0 : central ? 15000 : 45000

    // Older orders are further along the flow.
    let status: OrderStatus
    const r = rand()
    if (daysAgo > 14) status = r > 0.08 ? 'delivered' : 'cancelled'
    else if (daysAgo > 7) status = r > 0.25 ? 'delivered' : r > 0.1 ? 'shipped' : 'cancelled'
    else if (daysAgo > 3) status = r > 0.55 ? 'shipped' : r > 0.2 ? 'processing' : 'delivered'
    else status = r > 0.5 ? 'pending' : 'processing'

    out.push({
      ref: 'CHK-' + placed.getTime().toString(36).slice(-4).toUpperCase() + i.toString().padStart(2, '0'),
      placedAt: placed.toISOString(),
      status,
      customer: {
        name,
        phone: '07' + (Math.floor(rand() * 9) + 1) + Math.floor(rand() * 10000000).toString().padStart(7, '0'),
        email: rand() > 0.5 ? name.split(' ')[0].toLowerCase() + '@example.com' : undefined,
      },
      destination: { region, town, address: `Plot ${1 + Math.floor(rand() * 90)}, ${town}` },
      payment: PAYMENTS[Math.floor(rand() * PAYMENTS.length)],
      items, subtotal, discount, delivery,
      total: subtotal - discount + delivery,
      express: items.some((l) => products.find((p) => p.id === l.productId)?.express),
      // Roughly a third of demo orders arrived while the Admin was offline,
      // so the Agent picked them up from the orders group chat.
      handledBy: rand() > 0.68 ? 'agent' : 'admin',
    })
  }
  return out.sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt))
}

interface OrderState {
  orders: Order[]
  seeded: boolean
  addOrder: (o: Order) => void
  setStatus: (ref: string, status: OrderStatus) => void
  reseed: () => void
}

export const useOrders = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: seedOrders(),
      seeded: true,
      addOrder: (o) => set({ orders: [o, ...get().orders] }),
      setStatus: (ref, status) =>
        set({ orders: get().orders.map((o) => (o.ref === ref ? { ...o, status } : o)) }),
      reseed: () => set({ orders: seedOrders() }),
    }),
    {
      name: 'chikwafu-orders-v1',
      // If a stored copy predates the current catalogue, fall back to a fresh seed.
      merge: (persisted, current) => {
        const p = persisted as Partial<OrderState> | undefined
        if (!p?.orders?.length) return current
        return { ...current, ...p }
      },
    },
  ),
)
