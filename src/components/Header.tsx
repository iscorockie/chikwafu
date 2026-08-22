import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Phone, Search, ShoppingBag, X } from 'lucide-react'
import { useCart, useCartDetails } from '../store/cart'
import { cx } from '../lib/format'
import { Logo } from './Logo'

const NAV = [
  { to: '/shop', label: 'Shop All' },
  { to: '/shop?category=Kitchen', label: 'Kitchen' },
  { to: '/shop?category=Cooling', label: 'Cooling' },
  { to: '/shop?category=Home+Entertainment', label: 'Entertainment' },
  { to: '/shop?category=Laundry', label: 'Laundry' },
]

export function Header() {
  const { count } = useCartDetails()
  const openCart = useCart((s) => s.open)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [loc.pathname, loc.search])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <div className="relative z-50 overflow-hidden bg-ink text-cream">
        <div className="flex whitespace-nowrap py-2 text-[11.5px] font-medium tracking-wide animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center gap-10 pr-10">
              <span>Free delivery within Kampala on orders above UGX 1,500,000</span>
              <span className="text-copper-light">•</span>
              <span>Pay with MTN MoMo, Airtel Money, card or cash on delivery</span>
              <span className="text-copper-light">•</span>
              <span>Genuine warranty on every appliance</span>
              <span className="text-copper-light">•</span>
              <span>Same-day dispatch before 2pm</span>
              <span className="text-copper-light">•</span>
            </div>
          ))}
        </div>
      </div>

      <header
        className={cx(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled
            ? 'border-b border-ink/8 bg-cream/85 backdrop-blur-xl shadow-[0_1px_20px_-8px_rgba(20,17,15,.25)]'
            : 'border-b border-transparent bg-cream',
        )}
      >
        <div className="container-x flex h-[68px] items-center justify-between gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ink/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-2.5 lg:w-[220px]" aria-label="Chikwafu home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                to={n.to}
                className={({ isActive }) =>
                  cx(
                    'relative py-1 text-[13.5px] font-medium tracking-wide text-ink-500 transition-colors hover:text-ink',
                    isActive && loc.pathname === '/shop' && !loc.search && n.to === '/shop' && 'text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    <span
                      className={cx(
                        'absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-copper transition-transform duration-300',
                        isActive && 'scale-x-100',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 lg:w-[220px] lg:justify-end">
            <a
              href="tel:+256780844098"
              className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium text-ink-500 transition hover:bg-ink/5 hover:text-ink xl:flex"
            >
              <Phone size={15} className="shrink-0" /> 0780 844 098
            </a>
            <Link
              to="/shop"
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ink/5"
              aria-label="Search products"
            >
              <Search size={19} />
            </Link>
            <button
              onClick={openCart}
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ink/5"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag size={19} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="absolute -right-0.5 -top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-copper px-1 text-[10.5px] font-bold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-[70] w-[84vw] max-w-[340px] bg-cream p-6 shadow-lift lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="mt-10 flex flex-col">
                {NAV.map((n, i) => (
                  <motion.div
                    key={n.label}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05 }}
                  >
                    <Link
                      to={n.to}
                      className="block border-b border-ink/8 py-4 font-display text-xl text-ink transition hover:text-copper"
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <a href="tel:+256780844098" className="btn-primary mt-8 w-full">
                <Phone size={16} /> Call 0780 844 098
              </a>
              <p className="mt-6 text-xs leading-relaxed text-ink-500">
                Chikwafu Appliances<br />Plot 42, Ntinda Road, Kampala<br />Mon–Sat, 8:30am – 7pm
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
