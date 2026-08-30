import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Headset, MessageCircle, RotateCcw, Ticket } from 'lucide-react'
import { useOrders, type Order } from '../../store/orders'
import { useTickets, ticketIdFor } from '../../store/tickets'
import { usePresence } from '../../store/presence'
import { ADMIN_WA, AGENT_WA, ORDERS_GROUP_NAME, ticketMessage, waLink } from '../../lib/whatsapp'
import { UGX, cx } from '../../lib/format'

/**
 * Tickets filed to the Admin.
 *
 * When the Admin's WhatsApp is offline at the moment a client sends in an
 * order, the order lands in the "Chikwafu Orders" group chat and the Agent
 * (+256 786 028027) joins the chat — as an agent only. Every such order,
 * once DELIVERED, is automatically ticketed here for the Admin to review
 * and acknowledge.
 */
export default function AdminTickets() {
  const orders = useOrders((s) => s.orders)
  const acknowledged = useTickets((s) => s.acknowledged)
  const acknowledge = useTickets((s) => s.acknowledge)
  const reopen = useTickets((s) => s.reopen)
  const adminOnline = usePresence((s) => s.adminOnline)

  const [tab, setTab] = useState<'open' | 'acknowledged'>('open')
  const [expanded, setExpanded] = useState<string | null>(null)

  const tickets = useMemo(
    () =>
      orders
        .filter((o) => o.handledBy === 'agent' && o.status === 'delivered')
        .map((o) => ({ order: o, id: ticketIdFor(o.ref), acked: acknowledged.includes(o.ref) }))
        .sort((a, b) => +new Date(b.order.placedAt) - +new Date(a.order.placedAt)),
    [orders, acknowledged],
  )

  const list = tickets.filter((t) => (tab === 'open' ? !t.acked : t.acked))
  const openCount = tickets.filter((t) => !t.acked).length

  const waTicket = (o: Order, id: string) =>
    waLink(ADMIN_WA, ticketMessage({
      id,
      orderRef: o.ref,
      customer: `${o.customer.name} · ${o.customer.phone}`,
      destination: `${o.destination.address}, ${o.destination.town}, ${o.destination.region}`,
      total: o.total,
    }))

  return (
    <div>
      <header className="mb-7">
        <p className="eyebrow">Agent handovers</p>
        <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.5rem)] font-black leading-tight">
          Tickets
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-text-muted">
          Orders that arrived while your WhatsApp ({ADMIN_WA.display}) was offline were posted to
          the <strong className="text-text">{ORDERS_GROUP_NAME}</strong> group chat and handled by
          the Agent <strong className="text-text">{AGENT_WA.display}</strong> — agent role only.
          Each one becomes a ticket here the moment it is marked delivered.
        </p>
        <p className={cx(
          'mt-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-bold',
          adminOnline
            ? 'border-accent/40 bg-accent/10 text-accent'
            : 'border-amber-400/40 bg-amber-400/10 text-amber-300',
        )}>
          <span className={cx('h-2 w-2 rounded-full', adminOnline ? 'bg-accent' : 'bg-amber-400')} />
          {adminOnline
            ? 'You are online — new order chats come straight to you.'
            : 'You are offline — new orders route to the group chat; the Agent responds.'}
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['open', 'acknowledged'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              'chip',
              tab === t
                ? 'border-accent bg-accent text-bg'
                : 'border-white/15 text-text-muted hover:border-white/40',
            )}
          >
            {t === 'open' ? 'Open' : 'Acknowledged'}
            <span className="tabular-nums opacity-70">
              {t === 'open' ? openCount : tickets.length - openCount}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card py-20 text-center">
          <Ticket size={26} className="mx-auto text-text-dim" />
          <p className="mt-4 font-display text-lg font-black">
            {tab === 'open' ? 'No open tickets' : 'Nothing acknowledged yet'}
          </p>
          <p className="mt-1.5 text-[13.5px] text-text-muted">
            {tab === 'open'
              ? 'Every agent-handled order has been reviewed. Webale!'
              : 'Tickets you acknowledge will be archived here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(({ order: o, id, acked }) => {
            const open = expanded === id
            return (
              <div key={id} className="overflow-hidden rounded-2xl border border-white/10 bg-card">
                <button
                  onClick={() => setExpanded(open ? null : id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/4"
                >
                  <span className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                    acked ? 'bg-accent/12 text-accent' : 'bg-amber-400/12 text-amber-300',
                  )}>
                    <Headset size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-mono text-[12.5px] font-bold text-accent">{id}</span>
                      <span className="text-[12px] text-text-dim">order {o.ref}</span>
                      <span className={cx(
                        'rounded-full border px-2 py-0.5 text-[10.5px] font-bold',
                        acked
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-300',
                      )}>
                        {acked ? 'Acknowledged' : 'Awaiting review'}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-text-muted">
                      Delivered to <strong className="text-text">{o.customer.name}</strong> in{' '}
                      {o.destination.town}, {o.destination.region} · handled by Agent {AGENT_WA.display}
                    </span>
                  </span>
                  <span className="hidden text-[13px] font-black tabular-nums sm:block">{UGX(o.total)}</span>
                  <ChevronDown
                    size={16}
                    className={cx('shrink-0 text-text-dim transition-transform', open && 'rotate-180')}
                  />
                </button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-white/8 bg-bg-2/60"
                    >
                      <div className="grid gap-6 px-5 py-6 md:grid-cols-[1.4fr_1fr]">
                        <div>
                          <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-dim">
                            Items delivered
                          </h3>
                          <ul className="mt-3 divide-y divide-white/8">
                            {o.items.map((l) => (
                              <li key={l.productId} className="flex items-center justify-between gap-4 py-2.5">
                                <span className="min-w-0">
                                  <span className="block truncate text-[13px] font-bold text-text">{l.name}</span>
                                  <span className="text-[11.5px] text-text-muted">{l.qty} × {UGX(l.unitPrice)}</span>
                                </span>
                                <span className="shrink-0 text-[13px] font-bold tabular-nums">{UGX(l.lineTotal)}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 flex justify-between border-t border-white/10 pt-3 text-[12.5px] font-black">
                            <span>Total</span>
                            <span className="tabular-nums">{UGX(o.total)}</span>
                          </p>
                        </div>

                        <div>
                          <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-dim">
                            Handover
                          </h3>
                          <p className="mt-3 text-[13px] leading-relaxed text-text-muted">
                            <strong className="text-text">{o.customer.name}</strong> · {o.customer.phone}<br />
                            {o.destination.address}, {o.destination.town}, {o.destination.region}<br />
                            Chat: {ORDERS_GROUP_NAME} group · Agent {AGENT_WA.display}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {!acked ? (
                              <button
                                onClick={() => acknowledge(o.ref)}
                                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[12.5px] font-black text-bg transition hover:bg-accent-2"
                              >
                                <Check size={14} /> Acknowledge ticket
                              </button>
                            ) : (
                              <button
                                onClick={() => reopen(o.ref)}
                                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[12.5px] font-bold text-text-muted transition hover:border-white/40 hover:text-text"
                              >
                                <RotateCcw size={14} /> Reopen
                              </button>
                            )}
                            <a
                              href={waTicket(o, id)}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[12.5px] font-bold text-text-muted transition hover:border-accent hover:text-accent"
                            >
                              <MessageCircle size={14} /> View on WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
