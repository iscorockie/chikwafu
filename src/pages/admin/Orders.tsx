import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Headset, Search, Truck, X, Zap } from 'lucide-react'
import {
  STATUS_FLOW, STATUS_META, type Order, type OrderStatus,
} from '../../store/orders'
import { useAdminData } from '../../store/adminData'
import { UGX, cx } from '../../lib/format'
import { DataSourceNote } from './DataSourceNote'

const PAY_LABEL: Record<string, string> = {
  mtn: 'MTN MoMo', airtel: 'Airtel Money', card: 'Card', cod: 'Cash on delivery',
}

const FILTERS: (OrderStatus | 'all')[] = [
  'all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled',
]

export default function AdminOrders() {
  const { orders, setStatus, source, loading, error, refresh } = useAdminData()
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const list = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (q) {
        const hay = `${o.ref} ${o.customer.name} ${o.customer.phone} ${o.destination.town} ${o.destination.region}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [orders, filter, q])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: orders.length }
    orders.forEach((o) => { m[o.status] = (m[o.status] ?? 0) + 1 })
    return m
  }, [orders])

  const advance = (o: Order): OrderStatus | null => {
    const i = STATUS_FLOW.indexOf(o.status)
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null
  }

  return (
    <div>
      <header className="mb-7">
        <p className="eyebrow">Fulfilment</p>
        <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.5rem)] font-black leading-tight">
          Orders
        </h1>
        <p className="mt-2 text-[13.5px] text-text-muted">
          {list.length} of {orders.length} orders. Click a row to see the detail.
        </p>
        <DataSourceNote source={source} loading={loading} error={error} onRetry={refresh} />
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, customer, town…"
            className="input pl-11"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-dim hover:bg-white/10 hover:text-text"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cx(
              'chip',
              filter === f
                ? 'border-accent bg-accent text-bg'
                : 'border-white/15 text-text-muted hover:border-white/40',
            )}
          >
            {f === 'all' ? 'All' : STATUS_META[f].label}
            <span className="tabular-nums opacity-70">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card py-20 text-center">
          <p className="font-display text-lg font-black">No orders match</p>
          <p className="mt-1.5 text-[13.5px] text-text-muted">Try another status or search term.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10.5px] uppercase tracking-[0.14em] text-text-dim">
                  <th className="px-5 py-3.5 font-bold">Reference</th>
                  <th className="px-5 py-3.5 font-bold">Placed</th>
                  <th className="px-5 py-3.5 font-bold">Customer</th>
                  <th className="px-5 py-3.5 font-bold">Payment</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 text-right font-bold">Total</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {list.map((o) => {
                  const next = advance(o)
                  const open = expanded === o.ref
                  return (
                    <>
                      <tr
                        key={o.ref}
                        onClick={() => setExpanded(open ? null : o.ref)}
                        className="cursor-pointer border-b border-white/6 transition hover:bg-white/4"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-[12.5px] font-bold text-accent">{o.ref}</span>
                          {o.express && <Zap size={11} className="ml-1.5 inline fill-accent text-accent" />}
                        </td>
                        <td className="px-5 py-4 text-[12.5px] text-text-muted">
                          {new Date(o.placedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short',
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <span className="block text-[13px] font-bold text-text">
                            {o.customer.name}
                            {o.handledBy === 'agent' && (
                              <span
                                title="Admin was offline at order time — handled by the Agent (+256 786 028027) in the Chikwafu Orders group chat. Ticketed to Admin on delivery."
                                className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300"
                              >
                                <Headset size={10} /> Agent
                              </span>
                            )}
                          </span>
                          <span className="text-[11.5px] text-text-muted">
                            {o.destination.town}, {o.destination.region}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[12.5px] text-text-muted">
                          {PAY_LABEL[o.payment]}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cx(
                            'inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold',
                            STATUS_META[o.status].tone,
                          )}>
                            {STATUS_META[o.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-[13px] font-black tabular-nums">
                          {UGX(o.total)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <ChevronDown
                            size={16}
                            className={cx('inline text-text-dim transition-transform', open && 'rotate-180')}
                          />
                        </td>
                      </tr>
                      <AnimatePresence>
                        {open && (
                          <tr key={o.ref + '-detail'}>
                            <td colSpan={7} className="bg-bg-2/60 p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="grid gap-6 px-5 py-6 md:grid-cols-[1.4fr_1fr]">
                                  <div>
                                    <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-dim">
                                      Items
                                    </h3>
                                    <ul className="mt-3 divide-y divide-white/8">
                                      {o.items.map((l) => (
                                        <li key={l.productId} className="flex items-center justify-between gap-4 py-2.5">
                                          <span className="min-w-0">
                                            <span className="block truncate text-[13px] font-bold text-text">{l.name}</span>
                                            <span className="text-[11.5px] text-text-muted">
                                              {l.qty} × {UGX(l.unitPrice)}
                                            </span>
                                          </span>
                                          <span className="shrink-0 text-[13px] font-bold tabular-nums">
                                            {UGX(l.lineTotal)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                    <dl className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-[12.5px]">
                                      <div className="flex justify-between">
                                        <dt className="text-text-muted">Subtotal</dt>
                                        <dd className="tabular-nums">{UGX(o.subtotal)}</dd>
                                      </div>
                                      {o.discount > 0 && (
                                        <div className="flex justify-between text-accent">
                                          <dt>Discount</dt>
                                          <dd className="tabular-nums">−{UGX(o.discount)}</dd>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <dt className="text-text-muted">Delivery</dt>
                                        <dd className="tabular-nums">
                                          {o.delivery === 0 ? <span className="text-accent">Free</span> : UGX(o.delivery)}
                                        </dd>
                                      </div>
                                      <div className="flex justify-between border-t border-white/10 pt-2 font-black">
                                        <dt>Total</dt>
                                        <dd className="tabular-nums">{UGX(o.total)}</dd>
                                      </div>
                                    </dl>
                                  </div>

                                  <div>
                                    <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-dim">
                                      Deliver to
                                    </h3>
                                    <address className="mt-3 text-[13px] not-italic leading-relaxed text-text-muted">
                                      <strong className="text-text">{o.customer.name}</strong><br />
                                      {o.destination.address}<br />
                                      {o.destination.town}, {o.destination.region}<br />
                                      {o.customer.phone}
                                      {o.customer.email && <><br />{o.customer.email}</>}
                                    </address>

                                    <h3 className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-dim">
                                      Update status
                                    </h3>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {next && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); void setStatus(o, next) }}
                                          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[12.5px] font-black text-bg transition hover:bg-accent-2"
                                        >
                                          <Truck size={14} />
                                          Mark {STATUS_META[next].label.toLowerCase()}
                                        </button>
                                      )}
                                      {o.status !== 'cancelled' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); void setStatus(o, 'cancelled') }}
                                          className="rounded-full border border-danger/40 px-4 py-2 text-[12.5px] font-bold text-danger transition hover:bg-danger/10"
                                        >
                                          Cancel order
                                        </button>
                                      )}
                                      {o.status === 'cancelled' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); void setStatus(o, 'pending') }}
                                          className="rounded-full border border-white/20 px-4 py-2 text-[12.5px] font-bold text-text-muted transition hover:border-white/40 hover:text-text"
                                        >
                                          Reinstate
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
