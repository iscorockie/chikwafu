import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, Banknote, Package, ShoppingCart, TrendingUp, Zap,
} from 'lucide-react'
import { STATUS_META, type OrderStatus } from '../../store/orders'
import { useAdminData } from '../../store/adminData'
import { DataSourceNote } from './DataSourceNote'
import { products } from '../../lib/catalog'
import { UGX, UGXshort, cx } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1] as const

export default function Dashboard() {
  const { orders, source, loading, error, refresh } = useAdminData()

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'cancelled')
    const revenue = live.reduce((s, o) => s + o.total, 0)
    const units = live.reduce((s, o) => s + o.items.reduce((n, l) => n + l.qty, 0), 0)
    const pending = orders.filter((o) => o.status === 'pending').length
    const processing = orders.filter((o) => o.status === 'processing').length
    const aov = live.length ? revenue / live.length : 0

    const cut = Date.now() - 30 * 86400000
    const last30 = live.filter((o) => +new Date(o.placedAt) >= cut)
    const prev30 = live.filter(
      (o) => +new Date(o.placedAt) < cut && +new Date(o.placedAt) >= cut - 30 * 86400000,
    )
    const r30 = last30.reduce((s, o) => s + o.total, 0)
    const rPrev = prev30.reduce((s, o) => s + o.total, 0)
    const growth = rPrev ? ((r30 - rPrev) / rPrev) * 100 : null

    return { revenue, units, pending, processing, aov, count: live.length, r30, growth }
  }, [orders])

  const byStatus = useMemo(() => {
    const keys: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    const max = Math.max(...keys.map((k) => orders.filter((o) => o.status === k).length), 1)
    return keys.map((k) => ({
      status: k,
      n: orders.filter((o) => o.status === k).length,
      pct: (orders.filter((o) => o.status === k).length / max) * 100,
    }))
  }, [orders])

  /** Revenue for the last 14 days, for the sparkline. */
  const daily = useMemo(() => {
    const days: { label: string; total: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toDateString()
      const total = orders
        .filter((o) => o.status !== 'cancelled' && new Date(o.placedAt).toDateString() === key)
        .reduce((s, o) => s + o.total, 0)
      days.push({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), total })
    }
    return days
  }, [orders])
  const peak = Math.max(...daily.map((d) => d.total), 1)

  const topProducts = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number; revenue: number }>()
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) =>
        o.items.forEach((l) => {
          const cur = tally.get(l.productId) ?? { name: l.name, qty: 0, revenue: 0 }
          cur.qty += l.qty
          cur.revenue += l.lineTotal
          tally.set(l.productId, cur)
        }),
      )
    return [...tally.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
  }, [orders])

  const lowStock = useMemo(
    () => [...products].filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [],
  )

  const recent = orders.slice(0, 6)

  const CARDS = [
    { icon: Banknote, label: 'Revenue', value: UGXshort(stats.revenue), sub: `${stats.count} paid orders` },
    { icon: ShoppingCart, label: 'Orders to action', value: String(stats.pending + stats.processing), sub: `${stats.pending} pending · ${stats.processing} processing` },
    { icon: TrendingUp, label: 'Average order', value: UGXshort(stats.aov), sub: `${stats.units} units sold` },
    { icon: Package, label: 'Catalogue', value: String(products.length), sub: `${products.filter((p) => p.express).length} on Express` },
  ]

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow">Overview</p>
        <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.5rem)] font-black leading-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-[13.5px] text-text-muted">
          Trading summary across {orders.length} orders.
          {stats.growth !== null && (
            <>
              {' '}Last 30 days{' '}
              <strong className={cx(stats.growth >= 0 ? 'text-accent' : 'text-danger')}>
                {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(0)}%
              </strong>{' '}
              on the prior period.
            </>
          )}
        </p>
        <DataSourceNote source={source} loading={loading} error={error} onRetry={refresh} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.06, ease }}
            className="rounded-2xl border border-white/10 bg-card p-5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/12 text-accent">
              <c.icon size={16} />
            </span>
            <p className="mt-3.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-text-dim">
              {c.label}
            </p>
            <p className="mt-1 font-display text-[26px] font-black leading-none">{c.value}</p>
            <p className="mt-1.5 text-[12px] text-text-muted">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Revenue chart */}
        <section className="rounded-2xl border border-white/10 bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-black">Revenue, last 14 days</h2>
            <span className="text-[12.5px] text-text-muted">{UGX(stats.r30)} in 30 days</span>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {daily.map((d, i) => (
              <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end items-center gap-1.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((d.total / peak) * 100, 2)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease }}
                  className={cx(
                    'w-full rounded-t-md transition-colors',
                    d.total > 0 ? 'bg-accent/70 group-hover:bg-accent' : 'bg-white/8',
                  )}
                />
                <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md bg-bg px-2 py-1 text-[10.5px] font-bold text-text opacity-0 shadow-lift transition group-hover:opacity-100">
                  {UGXshort(d.total)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex justify-between text-[10.5px] text-text-dim">
            <span>{daily[0].label}</span>
            <span>{daily[daily.length - 1].label}</span>
          </div>
        </section>

        {/* Status breakdown */}
        <section className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="font-display text-lg font-black">Orders by status</h2>
          <ul className="mt-5 space-y-3.5">
            {byStatus.map((s) => (
              <li key={s.status}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-text">{STATUS_META[s.status].label}</span>
                  <span className="tabular-nums text-text-muted">{s.n}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.6, ease }}
                    className={cx(
                      'h-full rounded-full',
                      s.status === 'cancelled' ? 'bg-danger/70' : 'bg-accent',
                    )}
                  />
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/admin/orders"
            className="group mt-6 flex items-center gap-2 text-[13px] font-bold text-accent"
          >
            Manage orders
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top sellers */}
        <section className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="font-display text-lg font-black">Best sellers by revenue</h2>
          <ul className="mt-5 space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/8 text-[11.5px] font-black text-text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-text">{p.name}</span>
                  <span className="text-[11.5px] text-text-muted">{p.qty} sold</span>
                </span>
                <span className="shrink-0 text-[13px] font-black tabular-nums text-accent">
                  {UGXshort(p.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Low stock */}
        <section className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-black">
            <AlertTriangle size={17} className="text-amber-300" />
            Low stock
          </h2>
          <ul className="mt-5 space-y-3">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img
                  src={p.image}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg bg-white object-cover"
                />
                <span className="min-w-0 flex-1">
                  <Link
                    to={`/product/${p.slug}`}
                    className="block truncate text-[13px] font-bold text-text hover:text-accent"
                  >
                    {p.name}
                  </Link>
                  <span className="text-[11.5px] text-text-muted">{p.brand}</span>
                </span>
                <span
                  className={cx(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black tabular-nums',
                    p.stock <= 5
                      ? 'border-danger/30 bg-danger/15 text-danger'
                      : 'border-amber-400/30 bg-amber-400/15 text-amber-300',
                  )}
                >
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-lg font-black">Recent orders</h2>
          <Link to="/admin/orders" className="text-[12.5px] font-bold text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-white/10 text-[10.5px] uppercase tracking-[0.14em] text-text-dim">
                <th className="px-6 py-3 font-bold">Reference</th>
                <th className="px-6 py-3 font-bold">Customer</th>
                <th className="px-6 py-3 font-bold">Status</th>
                <th className="px-6 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.ref} className="border-b border-white/6 last:border-0 hover:bg-white/4">
                  <td className="px-6 py-3.5">
                    <Link
                      to="/admin/orders"
                      className="font-mono text-[12.5px] font-bold text-accent hover:underline"
                    >
                      {o.ref}
                    </Link>
                    {o.express && (
                      <Zap size={11} className="ml-1.5 inline fill-accent text-accent" />
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="block text-[13px] font-bold text-text">{o.customer.name}</span>
                    <span className="text-[11.5px] text-text-muted">
                      {o.destination.town}, {o.destination.region}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={cx(
                        'inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold',
                        STATUS_META[o.status].tone,
                      )}
                    >
                      {STATUS_META[o.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-[13px] font-black tabular-nums">
                    {UGX(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
