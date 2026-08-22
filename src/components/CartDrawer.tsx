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
            className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[3px]"
          />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-[440px] flex-col bg-cream shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink/8 px-6 py-5">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold">
                <ShoppingBag size={19} className="text-copper" />
                Your Cart
                {count > 0 && <span className="text-sm font-normal text-ink-300">({count})</span>}
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-ink/5"
              >
                <X size={19} />
              </button>
            </div>

            {detailed.length > 0 && (
              <div className="border-b border-ink/8 bg-white px-6 py-3.5">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-500">
                  <Truck size={15} className="shrink-0 text-copper" />
                  {toFree > 0 ? (
                    <span>
                      Add <strong className="text-ink">{UGX(toFree)}</strong> for free Kampala delivery
                    </span>
                  ) : (
                    <span className="font-medium text-moss">
                      You&apos;ve unlocked free Kampala delivery
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-300">
                  <motion.div
                    className="h-full rounded-full bg-copper"
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
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-cream-200">
                    <ShoppingBag size={30} className="text-ink-300" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold">Your cart is empty</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Browse our kitchen, cooling and laundry ranges.
                    </p>
                  </div>
                  <Link to="/shop" onClick={close} className="btn-primary mt-2">
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
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
                            className="h-[86px] w-[86px] rounded-xl bg-cream-200 object-cover"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-300">
                                {product.brand}
                              </p>
                              <Link
                                to={`/product/${product.slug}`}
                                onClick={close}
                                className="line-clamp-2 text-[13.5px] font-medium leading-snug transition hover:text-copper"
                              >
                                {product.name}
                              </Link>
                            </div>
                            <button
                              onClick={() => remove(product.id)}
                              aria-label={`Remove ${product.name}`}
                              className="shrink-0 rounded-full p-1.5 text-ink-300 transition hover:bg-ink/5 hover:text-copper"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-full border border-ink/12 bg-white">
                              <button
                                onClick={() => setQty(product.id, qty - 1)}
                                aria-label="Decrease quantity"
                                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-cream-200"
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
                                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-cream-200 disabled:opacity-30"
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
              <div className="border-t border-ink/8 bg-white px-6 py-5">
                {coupon && (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-moss/8 px-3.5 py-2.5">
                    <span className="flex items-center gap-2 text-[12.5px] font-medium text-moss">
                      <Tag size={14} /> {coupon} — {COUPONS[coupon].label}
                    </span>
                    <button
                      onClick={clearCoupon}
                      className="text-[11.5px] text-ink-500 underline underline-offset-2 hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <dl className="space-y-1.5 text-[13.5px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Subtotal</dt>
                    <dd className="font-medium tabular-nums">{UGX(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-moss">
                      <dt>Coupon discount</dt>
                      <dd className="font-medium tabular-nums">−{UGX(discount)}</dd>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex justify-between text-copper">
                      <dt>You save</dt>
                      <dd className="font-medium tabular-nums">{UGX(savings)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-500">
                    <dt>Delivery</dt>
                    <dd>Calculated at checkout</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-baseline justify-between border-t border-ink/8 pt-3">
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
                  className="mt-2 w-full py-2 text-[12.5px] text-ink-500 underline underline-offset-4 transition hover:text-ink"
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
