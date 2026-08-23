import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, MapPin, PackageCheck, Zap } from 'lucide-react'
import { CATEGORIES, products } from '../lib/catalog'
import { ProductCard } from '../components/ProductCard'
import { ExpressBadge } from '../components/ExpressBadge'

const ease = [0.22, 1, 0.36, 1] as const

const TIERS = [
  {
    days: '1',
    unit: 'business day',
    area: 'Kampala & Central Region',
    detail: 'Ordered before 2pm, delivered the next working day.',
  },
  {
    days: '2',
    unit: 'business days',
    area: 'The Rest of Central Region',
    detail: 'Wakiso, Mukono, Mpigi, Luweero and surrounding districts.',
  },
  {
    days: '3–4',
    unit: 'business days',
    area: 'East, North & West Regions',
    detail: 'Jinja, Mbale, Gulu, Lira, Mbarara, Fort Portal and the major towns.',
  },
  {
    days: '3–4',
    unit: 'business days',
    area: 'The Rest of East, North & West',
    detail: 'Outlying districts served through our regional partners.',
  },
]

export default function Express() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  const expressItems = products.filter((p) => p.express)
  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    count: expressItems.filter((p) => p.category === c).length,
  })).filter((x) => x.count > 0)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-bg-2">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[460px] w-[460px] rounded-full bg-accent/12 blur-[120px]" />
        <div className="container-x relative py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5"
          >
            <Zap size={13} className="fill-accent text-accent" />
            <span className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-accent">
              Faster delivery, countrywide
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.2rem)] font-black leading-[1.02] tracking-[-0.03em]"
          >
            Chikwafu <span className="text-accent">Express</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-text-muted"
          >
            Selected items ship on our fastest routes — one business day in Kampala,
            three to four upcountry. Look for the Express mark on any product.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href="#express-items" className="btn-primary group">
              Shop {expressItems.length} Express items
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <span className="flex items-center gap-2 text-[13px] text-text-muted">
              Look for <ExpressBadge size="sm" /> on the product
            </span>
          </motion.div>
        </div>
      </section>

      {/* Delivery tiers */}
      <section className="container-x py-16 lg:py-20">
        <p className="eyebrow">Delivery times</p>
        <h2 className="mt-2.5 font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-black leading-tight">
          Chikwafu Express offers you
        </h2>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.area}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-6"
            >
              <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/10 blur-2xl" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-black text-accent">{t.days}</span>
                <span className="text-[12.5px] font-bold text-text-muted">{t.unit}</span>
              </div>
              <p className="mt-3 text-[14px] font-bold leading-snug text-text">{t.area}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">{t.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-bg-2 p-6 sm:grid-cols-3">
          {[
            {
              icon: PackageCheck,
              t: 'Only on Express items',
              s: 'This service is available only for items showing the Chikwafu Express mark.',
            },
            {
              icon: CalendarClock,
              t: 'Business days only',
              s: 'Delivery times are business days and do not include Sunday.',
            },
            {
              icon: MapPin,
              t: 'Countrywide reach',
              s: 'Central, Eastern, Northern and Western regions all served.',
            },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-text">{t}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-text-muted">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-white/10 bg-bg-2 py-14">
        <div className="container-x">
          <p className="eyebrow">Categories</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-black">
            Express is available across
          </h2>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {byCategory.map(({ category, count }) => (
              <Link
                key={category}
                to={`/shop?category=${encodeURIComponent(category)}&express=1`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-card px-4 py-2.5 text-[13px] font-bold text-text transition-all hover:border-accent hover:bg-accent hover:text-bg"
              >
                {category}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] tabular-nums transition group-hover:bg-bg/20">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Express catalogue */}
      <section id="express-items" className="container-x scroll-mt-24 py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Ready to ship</p>
            <h2 className="mt-2.5 font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-black leading-tight">
              {expressItems.length} items on Express
            </h2>
          </div>
          <Link
            to="/shop"
            className="group flex items-center gap-2 text-[13.5px] font-bold text-text transition hover:text-accent"
          >
            Browse the full catalogue
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {expressItems.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-bg-2 py-16">
        <div className="container-x">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-black">
            Three steps, no surprises
          </h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              ['01', 'Pick an Express item', 'Anything showing the Express mark ships on our fastest routes.'],
              ['02', 'Order before 2pm', 'Same-day dispatch from our Ntinda store, Monday to Saturday.'],
              ['03', 'Track and receive', 'Our rider calls before arriving. Pay on delivery if you prefer.'],
            ].map(([n, t, s], i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="rounded-2xl border border-white/10 bg-card p-6"
              >
                <span className="font-display text-2xl font-black text-accent">{n}</span>
                <p className="mt-3 text-[15px] font-bold text-text">{t}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{s}</p>
              </motion.div>
            ))}
          </div>

          <ul className="mt-10 grid gap-2.5 sm:grid-cols-2">
            {[
              'Delivery in 1 business day for orders made in the Central Region',
              '2 business days for The Rest of Central Region',
              '3 to 4 business days for East, North & West Regions',
              '3 to 4 business days for The Rest of East, North & West Regions',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-text-muted">
                <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
