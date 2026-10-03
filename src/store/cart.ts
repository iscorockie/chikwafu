import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { products } from '../lib/catalog'
import type { CartLine, Product } from '../lib/types'

export const DELIVERY_KAMPALA = 15000
export const DELIVERY_UPCOUNTRY = 45000
export const FREE_DELIVERY_THRESHOLD = 1_500_000

interface CartState {
  lines: CartLine[]
  isOpen: boolean
  lastAdded: string | null
  coupon: string | null
  add: (productId: string, qty?: number) => void
  remove: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
  open: () => void
  close: () => void
  toggle: () => void
  applyCoupon: (code: string) => boolean
  clearCoupon: () => void
}

export const COUPONS: Record<string, { off: number; label: string }> = {
  KARIBU10: { off: 0.1, label: '10% welcome discount' },
  CHIKWAFU5: { off: 0.05, label: '5% loyalty discount' },
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      lastAdded: null,
      coupon: null,
      add: (productId, qty = 1) => {
        const p = products.find((x) => x.id === productId)
        // 518 catalogue lines are out of stock. Clamping to p.stock used to
        // push a qty-0 line, which opened a cart that looked full but totalled
        // zero and was then rejected by the API — so refuse instead.
        if (!p || p.stock <= 0) return
        const lines = [...get().lines]
        const i = lines.findIndex((l) => l.productId === productId)
        const next = Math.min(i > -1 ? lines[i].qty + qty : qty, p.stock)
        if (next < 1) return
        if (i > -1) lines[i] = { ...lines[i], qty: next }
        else lines.push({ productId, qty: next })
        set({ lines, isOpen: true, lastAdded: productId })
        setTimeout(() => {
          if (get().lastAdded === productId) set({ lastAdded: null })
        }, 2200)
      },
      remove: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      setQty: (productId, qty) => {
        const p = products.find((x) => x.id === productId)
        const max = Math.max(0, p?.stock ?? 99)
        set({
          lines:
            qty <= 0
              ? get().lines.filter((l) => l.productId !== productId)
              : get().lines.map((l) =>
                  l.productId === productId ? { ...l, qty: Math.min(qty, max) } : l,
                ),
        })
      },
      clear: () => set({ lines: [], coupon: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      applyCoupon: (code) => {
        const key = code.trim().toUpperCase()
        if (COUPONS[key]) {
          set({ coupon: key })
          return true
        }
        return false
      },
      clearCoupon: () => set({ coupon: null }),
    }),
    {
      name: 'chikwafu-cart-v1',
      partialize: (s) => ({ lines: s.lines, coupon: s.coupon }),
    },
  ),
)

export interface DetailedLine {
  product: Product
  qty: number
  lineTotal: number
}

export const useCartDetails = () => {
  const lines = useCart((s) => s.lines)
  const coupon = useCart((s) => s.coupon)

  const detailed: DetailedLine[] = lines
    .map((l) => {
      // Drop lines whose product has since gone out of stock, and any stale
      // qty-0 line persisted by an older build, so totals can never read zero
      // while the cart looks occupied.
      const product = products.find((p) => p.id === l.productId)
      if (!product) return null
      const qty = Math.min(l.qty, product.stock)
      return qty > 0 ? { product, qty, lineTotal: product.price * qty } : null
    })
    .filter(Boolean) as DetailedLine[]

  const count = detailed.reduce((s, l) => s + l.qty, 0)
  const subtotal = detailed.reduce((s, l) => s + l.lineTotal, 0)
  const savings = detailed.reduce(
    (s, l) => s + (l.product.compareAt ? (l.product.compareAt - l.product.price) * l.qty : 0),
    0,
  )
  const discount = coupon && COUPONS[coupon] ? Math.round(subtotal * COUPONS[coupon].off) : 0

  return { detailed, count, subtotal, savings, discount, coupon }
}

export const deliveryFeeFor = (region: string, subtotal: number) => {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
  return region === 'Kampala' || region === 'Wakiso' || region === 'Mukono'
    ? DELIVERY_KAMPALA
    : DELIVERY_UPCOUNTRY
}
