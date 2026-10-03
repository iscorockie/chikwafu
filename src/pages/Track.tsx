import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, MapPin, PackageCheck, Phone, Search, Truck, X } from 'lucide-react'
import { api, useApiEnabled, type TrackView } from '../lib/api'
import { useOrders } from '../store/orders'
import { UGX, cx } from '../lib/format'

const normalizePhone = (p: string) => {
  const d = p.replace(/\s/g, '')
  return d.startsWith('+256') ? '0' + d.slice(4) : d
}

/** Same shape as the API view, built from the local (demo) ledger. */
function fromLocalOrder(ref: string, phone: string, orders: ReturnType<typeof useOrders.getState>['orders']): TrackView | null {
  const o = orders.find(
    (x) =>
      x.ref.toUpperCase() === ref.toUpperCase() &&
      normalizePhone(x.customer.phone) === normalizePhone(phone),
  )
  if (!o) return null
  const step = ['pending', 'processing', 'shipped', 'delivered'].indexOf(o.status)
  const cancelled = o.status === 'cancelled'
  const days = cancelled ? 0 : ['Kampala', 'Wakiso', 'Mukono'].includes(o.destination.region) ? 1 : 4
  return {
    ref: o.ref,
    status: o.status,
    placedAt: o.placedAt,
    paymentMethod: o.payment,
    isPaid: o.status !== 'pending' && !cancelled,
    region: o.destination.region,
    town: o.destination.town,
    itemCount: o.items.reduce((s, l) => s + l.qty, 0),
    total: o.total,
    express: o.express,
    eta: cancelled ? null : new Date(+new Date(o.placedAt) + days * 86400000).toISOString(),
    timeline: [
      { key: 'pending', label: 'Order placed', at: o.placedAt, done: !cancelled },
      { key: 'processing', label: 'Processing at Ntinda', at: null, done: step >= 1 },
      { key: 'shipped', label: 'With our rider', at: null, done: step >= 2 },
      {
        key: 'delivered',
        label: cancelled ? 'Cancelled' : 'Delivered',
        at: null,
        done: o.status === 'delivered' || cancelled,
      },
    ],
  }
}

const STATUS_LINE: Record<TrackView['status'], string> = {
  pending: 'We’ve received your order and will call to confirm shortly.',
  processing: 'Paid and being picked at the Ntinda showroom.',
  shipped: 'On the bike — our rider calls before arriving.',
  delivered: 'Delivered. Thank you for shopping Chikwafu!',
  cancelled: 'This order was cancelled. Any money held was released immediately.',
}

export default function Track() {
  const apiEnabled = useApiEnabled()
  const [ref, setRef] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<TrackView | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (apiEnabled) {
        setView(await api.trackOrder(ref.trim(), phone.trim()))
      } else {
        const local = fromLocalOrder(ref.trim(), phone.trim(), useOrders.getState().orders)
        if (!local) throw new Error('not found')
        setView(local)
      }
    } catch {
      setView(null)
      setError(
        'No order matches that reference and phone number. Check your confirmation email, ' +
          'or call 0780 844 098 and we will look it up.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-12 lg:py-16">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-accent">
        <ArrowLeft size={15} /> Continue shopping
      </Link>

      <div className="mt-7 max-w-2xl">
        <p className="eyebrow">Where is my stuff?</p>
        <h1 className="mt-2.5 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-semibold leading-tight">
          Track your order
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-text-muted">
          Enter the reference from your confirmation (for example{' '}
          <code className="font-mono text-text">CHK-A1B2C3</code>) and the phone number you
          ordered with.
        </p>

        <form onSubmit={submit} className="mt-7 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Order reference"
            aria-label="Order reference"
            required
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="input font-mono uppercase"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            aria-label="Phone number used for the order"
            inputMode="tel"
            required
            className="input"
          />
          <button type="submit" disabled={busy} className="btn-primary shrink-0">
            {busy ? 'Checking…' : <><Search size={15} /> Track</>}
          </button>
        </form>
        <div aria-live="polite">
          {error && (
            <p className="mt-3 flex items-start gap-2 text-[13px] text-danger">
              <X size={14} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>

      {view && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 max-w-2xl overflow-hidden rounded-[22px] border border-white/10 bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
            <div>
              <p className="font-mono text-[13px] font-bold text-accent">{view.ref}</p>
              <p className="mt-1 text-[12.5px] text-text-muted">
                Placed{' '}
                {new Date(view.placedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
                {' · '}
                {view.itemCount} item{view.itemCount === 1 ? '' : 's'} · {UGX(view.total)}
              </p>
            </div>
            <span
              className={cx(
                'rounded-full border px-3 py-1.5 text-[11.5px] font-black uppercase tracking-wider',
                view.status === 'cancelled'
                  ? 'border-danger/40 bg-danger/10 text-danger'
                  : view.status === 'delivered'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-white/20 bg-white/5 text-text',
              )}
            >
              {view.status}
            </span>
          </div>

          <div className="px-6 py-6">
            <p className="text-[14px] leading-relaxed text-text-muted">{STATUS_LINE[view.status]}</p>

            <ol className="mt-6 space-y-0">
              {view.timeline.map((t, i) => (
                <li key={t.key} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < view.timeline.length - 1 && (
                    <span
                      className={cx(
                        'absolute left-[13px] top-7 h-full w-0.5',
                        t.done ? 'bg-accent/60' : 'bg-white/10',
                      )}
                    />
                  )}
                  <span
                    className={cx(
                      'relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full',
                      t.done ? 'bg-accent text-bg' : 'bg-bg-3 text-text-dim',
                    )}
                  >
                    {t.done ? <Check size={13} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <div className="pt-0.5">
                    <p className={cx('text-[13.5px] font-bold', t.done ? 'text-text' : 'text-text-dim')}>
                      {t.label}
                    </p>
                    {t.at && (
                      <p className="text-[11.5px] text-text-dim">
                        {new Date(t.at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
              <p className="flex items-center gap-2 text-[12.5px] text-text-muted">
                <MapPin size={14} className="shrink-0 text-accent" />
                {view.town ? `${view.town}, ` : ''}{view.region}
              </p>
              <p className="flex items-center gap-2 text-[12.5px] text-text-muted">
                <Truck size={14} className="shrink-0 text-accent" />
                {view.eta
                  ? `ETA ${new Date(view.eta).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`
                  : 'No delivery scheduled'}
              </p>
              <p className="flex items-center gap-2 text-[12.5px] text-text-muted">
                <PackageCheck size={14} className="shrink-0 text-accent" />
                {view.isPaid
                  ? 'Paid'
                  : view.paymentMethod === 'cod'
                    ? 'Cash on delivery'
                    : 'Payment pending'}
              </p>
            </div>

            <p className="mt-5 flex items-center gap-2 text-[12.5px] text-text-dim">
              <Phone size={13} />
              Questions about this order?{' '}
              <a href="tel:+256780844098" className="font-bold text-accent underline underline-offset-2">
                0780 844 098
              </a>
            </p>
          </div>
        </motion.section>
      )}
    </div>
  )
}
