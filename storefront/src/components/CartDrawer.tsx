import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Tag, Trash2, Truck, X } from 'lucide-react'
import {
  COUPONS,
  FREE_DELIVERY_THRESHOLD,
  useCart,
  useCartDetails,
} from '../store/cart'
import { UGX } from '../lib/format'

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen)
  const close = useCart((s) => s.close)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const clearCoupon = useCart((s) => s.clearCoupon)
  const { detailed, count, subtotal, savings, discount, coupon } = useCartDetails()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    if (isOpen) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  const toFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-[3px]"
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-[440px] flex-col bg-bg shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold">
                <ShoppingBag size={19} className="text-accent" />
                Your Cart
                {count > 0 && <span className="text-sm font-normal text-text-dim">({count})</span>}
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-bg-2/5"
              >
                <X size={19} />
              </button>
            </div>

            {detailed.length > 0 && (
              <div className="border-b border-white/10 bg-card px-6 py-3.5">
                <div className="flex items-center gap-2 text-[12.5px] text-text-muted">
                  <Truck size={15} className="shrink-0 text-accent" />
                  {toFree > 0 ? (
                    <span>
                      Add <strong className="text-text">{UGX(toFree)}</strong> for free Kampala delivery
                    </span>
                  ) : (
                    <span className="font-medium text-accent">
                      You&apos;ve unlocked free Kampala delivery
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-3">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6">
              {detailed.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-bg-3">
                    <ShoppingBag size={30} className="text-text-dim" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold">Your cart is empty</p>
                    <p className="mt-1 text-sm text-text-muted">
                      Browse our kitchen, cooling and laundry ranges.
                    </p>
                  </div>
                  <Link to="/shop" onClick={close} className="btn-primary mt-2">
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/10">
                  <AnimatePresence initial={false}>
                    {detailed.map(({ product, qty, lineTotal }) => (
                      <motion.li
                        key={product.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.28 }}
                        className="flex gap-4 overflow-hidden py-4"
                      >
                        <Link to={`/product/${product.slug}`} onClick={close} className="shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-[86px] w-[86px] rounded-xl bg-white object-cover"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-text-dim">
                                {product.brand}
                              </p>
                              <Link
                                to={`/product/${product.slug}`}
                                onClick={close}
                                className="line-clamp-2 text-[13.5px] font-medium leading-snug transition hover:text-accent"
                              >
                                {product.name}
                              </Link>
                            </div>
                            <button
                              onClick={() => remove(product.id)}
                              aria-label={`Remove ${product.name}`}
                              className="shrink-0 rounded-full p-1.5 text-text-dim transition hover:bg-bg-2/5 hover:text-accent"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-full border border-white/12 bg-card">
                              <button
                                onClick={() => setQty(product.id, qty - 1)}
                                aria-label="Decrease quantity"
                                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-bg-3"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-7 text-center text-[13px] font-semibold tabular-nums">
                                {qty}
                              </span>
                              <button
                                onClick={() => setQty(product.id, qty + 1)}
                                disabled={qty >= product.stock}
                                aria-label="Increase quantity"
                                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-bg-3 disabled:opacity-30"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <span className="text-[14px] font-semibold tabular-nums">
                              {UGX(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {detailed.length > 0 && (
              <div className="border-t border-white/10 bg-card px-6 py-5">
                {coupon && (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-accent/10 px-3.5 py-2.5">
                    <span className="flex items-center gap-2 text-[12.5px] font-medium text-accent">
                      <Tag size={14} /> {coupon} — {COUPONS[coupon].label}
                    </span>
                    <button
                      onClick={clearCoupon}
                      className="text-[11.5px] text-text-muted underline underline-offset-2 hover:text-text"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <dl className="space-y-1.5 text-[13.5px]">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Subtotal</dt>
                    <dd className="font-medium tabular-nums">{UGX(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-accent">
                      <dt>Coupon discount</dt>
                      <dd className="font-medium tabular-nums">−{UGX(discount)}</dd>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex justify-between text-accent">
                      <dt>You save</dt>
                      <dd className="font-medium tabular-nums">{UGX(savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-text-muted">
                    <dt>Delivery</dt>
                    <dd>Calculated at checkout</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
                  <span className="font-display text-base font-semibold">Total</span>
                  <span className="font-display text-xl font-semibold tabular-nums">
                    {UGX(subtotal - discount)}
                  </span>
                </div>
                <Link to="/checkout" onClick={close} className="btn-primary mt-4 w-full">
                  Proceed to checkout
                </Link>
                <button
                  onClick={close}
                  className="mt-2 w-full py-2 text-[12.5px] text-text-muted underline underline-offset-4 transition hover:text-text"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
