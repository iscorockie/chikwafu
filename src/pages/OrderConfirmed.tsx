import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Package, Phone, Truck } from 'lucide-react'
import { UGX } from '../lib/format'

interface Order {
  ref: string
  items: { name: string; qty: number; total: number }[]
  subtotal: number
  discount: number
  delivery: number
  total: number
  payment: string
  delivery_details: { fullName: string; phone: string; region: string; town: string; address: string }
  placedAt: string
}

const LABELS: Record<string, string> = {
  mtn: 'MTN Mobile Money',
  airtel: 'Airtel Money',
  card: 'Card',
  cod: 'Cash on delivery',
}

export default function OrderConfirmed() {
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    const raw = sessionStorage.getItem('chikwafu-last-order')
    if (raw) setOrder(JSON.parse(raw))
  }, [])

  const eta = new Date(Date.now() + 1000 * 60 * 60 * 26).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="container-x py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-moss/12"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', damping: 12 }}
            className="grid h-14 w-14 place-items-center rounded-full bg-moss text-white"
          >
            <Check size={28} strokeWidth={3} />
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-7 font-display text-[clamp(2rem,4.6vw,3rem)] font-semibold leading-tight"
        >
          Webale nnyo — your order is in.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-500"
        >
          {order
            ? <>We&apos;ve sent a confirmation to {order.delivery_details.phone}. Our team will call before dispatch.</>
            : <>We&apos;ve sent a confirmation by SMS. Our team will call before dispatch.</>}
        </motion.p>

        {order && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] shadow-soft"
          >
            <span className="text-ink-500">Order reference</span>
            <strong className="font-mono tracking-wider text-copper">{order.ref}</strong>
          </motion.p>
        )}
      </div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-soft"
        >
          <div className="grid gap-px bg-ink/8 sm:grid-cols-3">
            {[
              { icon: Package, l: 'Status', v: 'Payment confirmed' },
              { icon: Truck, l: 'Estimated delivery', v: eta },
              { icon: Phone, l: 'Paid with', v: LABELS[order.payment] ?? order.payment },
            ].map(({ icon: Icon, l, v }) => (
              <div key={l} className="bg-white p-5">
                <Icon size={16} className="text-copper" />
                <p className="mt-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-300">{l}</p>
                <p className="mt-0.5 text-[13.5px] font-semibold leading-snug">{v}</p>
              </div>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold">What you ordered</h2>
            <ul className="mt-4 divide-y divide-ink/8">
              {order.items.map((it) => (
                <li key={it.name} className="flex items-center justify-between gap-4 py-3 text-[13.5px]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{it.name}</span>
                    <span className="text-[12px] text-ink-300">Qty {it.qty}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{UGX(it.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-ink/8 pt-5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="tabular-nums">{UGX(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-moss">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{UGX(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-500">Delivery</dt>
                <dd className="tabular-nums">
                  {order.delivery === 0 ? <span className="text-moss">Free</span> : UGX(order.delivery)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/8 pt-3">
                <dt className="font-display text-base font-semibold text-ink">Total paid</dt>
                <dd className="font-display text-xl font-semibold tabular-nums text-ink">
                  {UGX(order.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl bg-cream p-5">
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-300">Delivering to</p>
              <address className="mt-1.5 text-[13.5px] not-italic leading-relaxed text-ink-500">
                <strong className="text-ink">{order.delivery_details.fullName}</strong><br />
                {order.delivery_details.address}<br />
                {order.delivery_details.town}, {order.delivery_details.region}
              </address>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="btn-primary">Continue shopping</Link>
        <a href="tel:+256772000111" className="btn-ghost">
          <Phone size={15} /> Call us on 0772 000 111
        </a>
      </div>
    </div>
  )
}
