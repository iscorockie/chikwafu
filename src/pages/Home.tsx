import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import { collections, products } from '../lib/catalog'
import { ProductCard } from '../components/ProductCard'
import { Stars } from '../components/Stars'
import { UGX } from '../lib/format'

const ease = [0.22, 1, 0.36, 1] as const

function Hero() {
  const hero = products.find((p) => p.slug === 'rwenzori-350l-double-door-fridge')!
  return (
    <section className="relative overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/12 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-accent/8 blur-[120px]" />

      <div className="container-x relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5"
          >
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
            <span className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-accent">
              Kampala · Same-day delivery
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease }}
            className="mt-6 font-display text-[clamp(2.6rem,6.4vw,4.6rem)] font-black leading-[1.02] tracking-[-0.03em] text-text"
          >
            Appliances built
            <br />
            <span className="text-accent">to outlast the box.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-text-muted"
          >
            Fridges, cookers, washers and kitchen essentials — genuine stock, real prices,
            warranty included. Order online or send one message on WhatsApp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.26, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link to="/shop" className="btn-primary group">
              Browse catalogue
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://wa.me/256780844098?text=Hi%20Chikwafu%2C%20I%20have%20a%20question%20about%20an%20appliance"
              target="_blank"
              rel="noreferrer noopener"
              className="btn-ghost"
            >
              Ask us anything
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-7"
          >
            {[
              { v: '12,400+', l: 'Homes supplied' },
              { v: '4.7 / 5', l: 'Average rating' },
              { v: '5 yrs', l: 'Max warranty' },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-2xl font-semibold text-text">{s.v}</dt>
                <dd className="mt-1 text-[12px] uppercase tracking-[0.12em] text-text-dim">{s.l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-card p-6 shadow-lift sm:p-10">
            <img
              src={hero.image}
              alt={hero.name}
              className="mx-auto w-full max-w-[420px] object-contain drop-shadow-2xl"
              fetchPriority="high"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease }}
            className="absolute -bottom-5 left-2 w-[240px] rounded-2xl border border-white/10 bg-bg-2/95 p-4 shadow-lift backdrop-blur sm:left-6"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Featured
            </p>
            <p className="mt-1.5 font-display text-[15px] font-semibold leading-snug">{hero.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={hero.rating} size={12} />
              <span className="text-[11.5px] text-text-dim">({hero.reviewCount})</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-base font-semibold">{UGX(hero.price)}</span>
              <span className="text-[12px] text-text-dim line-through">{UGX(hero.compareAt!)}</span>
            </div>
            <Link
              to={`/product/${hero.slug}`}
              className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-accent transition hover:gap-2.5"
            >
              View details <ArrowRight size={13} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75, duration: 0.6, ease }}
            className="absolute -right-1 top-8 hidden items-center gap-2.5 rounded-2xl border border-white/12 bg-bg-2 px-4 py-3 text-text shadow-lift sm:flex"
          >
            <ShieldCheck size={18} className="text-accent" />
            <div className="leading-tight">
              <p className="text-[12.5px] font-semibold">5-year compressor</p>
              <p className="text-[11px] text-text-muted">warranty included</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function TrustBar() {
  const items = [
    { icon: Truck, t: 'Countrywide delivery', s: 'Same-day in Kampala before 2pm' },
    { icon: ShieldCheck, t: 'Genuine warranty', s: 'Up to 5 years, honoured locally' },
    { icon: Wrench, t: 'Free installation', s: 'On fridges, cookers & washers' },
    { icon: Headphones, t: 'Real support', s: 'Talk to a person, not a bot' },
  ]
  return (
    <section className="border-y border-white/10 bg-card">
      <div className="container-x grid gap-x-8 gap-y-7 py-9 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, t, s }, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="flex items-start gap-3.5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-text">{t}</p>
              <p className="mt-0.5 text-[12.5px] text-text-muted">{s}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Collections() {
  return (
    <section className="container-x py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Shop by room</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
            Featured collections
          </h2>
        </div>
        <Link
          to="/shop"
          className="group flex items-center gap-2 text-[13.5px] font-semibold text-text transition hover:text-accent"
        >
          View everything
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.08, ease }}
          >
            <Link
              to={`/shop?category=${encodeURIComponent(c.category)}`}
              className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-card"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-xl font-semibold text-text">{c.title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-text-muted">{c.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent transition-all group-hover:gap-3">
                  Explore <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Featured() {
  const list = products.filter((p) => p.featured).slice(0, 4)
  return (
    <section className="border-y border-white/10 bg-bg-2 py-20">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
              This month&apos;s favourites
            </h2>
          </div>
          <Link
            to="/shop?sort=rating"
            className="group flex items-center gap-2 text-[13.5px] font-semibold text-text transition hover:text-accent"
          >
            Top rated
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Promo() {
  const p = products.find((x) => x.slug === 'kabira-55l-digital-air-fryer')!
  return (
    <section className="container-x py-20">
      <div className="relative grid items-center gap-10 overflow-hidden rounded-[28px] border border-white/10 bg-card px-7 py-12 text-text grain sm:px-12 lg:grid-cols-2 lg:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Limited offer
          </p>
          <h2 className="mt-3.5 font-display text-[clamp(2rem,4.4vw,3.2rem)] font-semibold leading-[1.05]">
            Save 16% on the
            <br />
            air fryer everyone
            <br />
            is talking about.
          </h2>
          <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-text-muted">
            Crisp chips, samosas and a whole chicken on a spoonful of oil — and noticeably less
            power than firing up the oven.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link to={`/product/${p.slug}`} className="btn-primary group">
              Shop the air fryer
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-2xl font-semibold">{UGX(p.price)}</span>
              <span className="text-[13px] text-text-dim line-through">{UGX(p.compareAt!)}</span>
            </div>
          </div>
          <p className="mt-6 flex items-center gap-2 text-[12.5px] text-text-muted">
            <BadgeCheck size={15} className="text-accent" />
            Use code <strong className="text-text">KARIBU10</strong> for a further 10% at checkout
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="relative z-10"
        >
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="mx-auto w-full max-w-[380px] rounded-2xl object-cover shadow-lift"
          />
        </motion.div>
      </div>
    </section>
  )
}

function Bestsellers() {
  const list = products.filter((p) => p.bestseller || p.rating >= 4.5).slice(0, 8)
  return (
    <section className="container-x pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Moving fast</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
            Kampala&apos;s bestsellers
          </h2>
        </div>
      </div>
      <div className="mt-10 grid gap-x-5 gap-y-10 grid-cols-2 lg:grid-cols-4">
        {list.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  )
}

function Testimonials() {
  const picks = [
    products[4].reviews[0],
    products[0].reviews[0],
    products[6].reviews[1],
  ]
  return (
    <section className="border-y border-white/10 bg-bg-2 py-20">
      <div className="container-x">
        <p className="eyebrow">Word of mouth</p>
        <h2 className="mt-2.5 max-w-2xl font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
          Trusted in homes from Ntinda to Arua
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {picks.map((r, i) => (
            <motion.blockquote
              key={r.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease }}
              className="rounded-2xl border border-white/10 bg-card p-6"
            >
              <Stars rating={r.rating} size={14} />
              <p className="mt-3.5 font-display text-[17px] font-medium leading-snug text-text">
                “{r.title}”
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">{r.body}</p>
              <footer className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/12 text-[12.5px] font-bold text-accent">
                  {r.author.split(' ').map((n) => n[0]).join('')}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-text">{r.author}</p>
                  <p className="text-[11.5px] text-text-dim">{r.location}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

function Newsletter() {
  return (
    <section className="container-x py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Stay in the loop</p>
        <h2 className="mt-2.5 font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold leading-tight">
          New arrivals and quiet discounts
        </h2>
        <p className="mx-auto mt-3.5 max-w-md text-[14.5px] leading-relaxed text-text-muted">
          One email a month. Stock alerts, clearance on ex-display units, and nothing else.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const f = e.currentTarget
            const btn = f.querySelector('button')!
            btn.textContent = 'Subscribed ✓'
            btn.setAttribute('disabled', 'true')
          }}
          className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            aria-label="Email address"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary shrink-0">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Collections />
      <Featured />
      <Promo />
      <Bestsellers />
      <Testimonials />
      <Newsletter />
    </>
  )
}
