import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Store, Ticket, X,
} from 'lucide-react'
import { Logo } from '../../components/Logo'
import { cx } from '../../lib/format'
import { useAuth } from '../../store/auth'
import { usePresence } from '../../store/presence'
import { useOrders } from '../../store/orders'
import { useTickets } from '../../store/tickets'
import { ADMIN_WA } from '../../lib/whatsapp'
import AdminLogin from './Login'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket, end: false },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const expiresAt = useAuth((s) => s.expiresAt)
  const signOut = useAuth((s) => s.signOut)
  const authed = expiresAt > Date.now()

  const adminOnline = usePresence((s) => s.adminOnline)
  const toggleAdmin = usePresence((s) => s.toggleAdmin)
  const orders = useOrders((s) => s.orders)
  const acknowledged = useTickets((s) => s.acknowledged)
  const openTickets = orders.filter(
    (o) => o.handledBy === 'agent' && o.status === 'delivered' && !acknowledged.includes(o.ref),
  ).length

  useEffect(() => setOpen(false), [loc.pathname])

  // Expire the session in-place if the tab is left open past the window.
  useEffect(() => {
    if (!authed) return
    const t = setTimeout(signOut, Math.max(0, expiresAt - Date.now()))
    return () => clearTimeout(t)
  }, [authed, expiresAt, signOut])

  if (!authed) return <AdminLogin />

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold transition-colors',
              isActive
                ? 'bg-accent text-bg'
                : 'text-text-muted hover:bg-white/8 hover:text-text',
            )
          }
        >
          <Icon size={17} />
          {label}
          {label === 'Tickets' && openTickets > 0 && (
            <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[10.5px] font-black tabular-nums text-amber-300">
              {openTickets}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-bg-2/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-text transition hover:bg-white/10 lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu size={19} />
            </button>
            <Link to="/admin" className="flex items-center gap-3">
              <Logo className="h-8" />
              <span className="hidden rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-accent sm:inline">
                Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin WhatsApp presence — decides where new order chats are routed */}
            <button
              onClick={toggleAdmin}
              title={
                adminOnline
                  ? `Admin WhatsApp ${ADMIN_WA.display} is online — clients chat with you directly. Click to go offline.`
                  : `Admin WhatsApp ${ADMIN_WA.display} is offline — new orders go to the group chat and the Agent joins as agent. Click to come back online.`
              }
              className={cx(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-bold transition',
                adminOnline
                  ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20',
              )}
            >
              <span
                className={cx(
                  'h-2 w-2 rounded-full',
                  adminOnline ? 'bg-accent' : 'bg-amber-400',
                )}
              />
              <span className="hidden sm:inline">WhatsApp</span>
              {adminOnline ? 'Online' : 'Offline'}
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[12.5px] font-bold text-text-muted transition hover:border-white/35 hover:text-text"
            >
              <Store size={14} /> <span className="hidden sm:inline">View</span> storefront
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[12.5px] font-bold text-text-muted transition hover:border-danger/50 hover:text-danger"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-8 px-5 py-8 lg:px-8">
        <aside className="hidden w-[210px] shrink-0 lg:block">
          <div className="sticky top-24">{nav}</div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[70] w-[76vw] max-w-[280px] border-r border-white/10 bg-bg-2 p-5 lg:hidden">
            <div className="mb-8 flex items-center justify-between">
              <Logo className="h-8" />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-text transition hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            {nav}
            <Link
              to="/"
              className="mt-8 flex items-center gap-2 text-[13px] font-bold text-text-muted hover:text-accent"
            >
              <ArrowLeft size={15} /> Back to storefront
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
