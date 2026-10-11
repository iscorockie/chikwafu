import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react'
import { api, useApiEnabled } from '../lib/api'
import { collections, products } from '../lib/catalog'
import { ProductCard } from '../components/ProductCard'
import { Stars } from '../components/Stars'
import { UGX, cx, onPhotoError } from '../lib/format'
import { ADMIN_WA, AGENT_WA, waLink } from '../lib/whatsapp'
import { usePresence } from '../store/presence'

const ease = [0.22, 1, 0.36, 1] as const

function Hero() {
  // If the Admin's WhatsApp is offline, questions go to the Agent line
  // (agent role only); otherwise the Admin takes the chat directly.
  const adminOnline = usePresence((s) => s.adminOnline)
  const supportContact = adminOnline ? ADMIN_WA : AGENT_WA
  // Fall back to the first featured product so a catalogue change can never
  // blank the hero (a hardcoded slug previously did exactly that).
  const hero =
    products.find((p) => p.slug === 'hisense-270l-double-door-fridge-dispenser') ??
    products.find((p) => p.featured) ??
    products[0]
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
            Genuine appliances,
            <br />
            <span className="em">warranty-backed</span> for
            <br />
            every Ugandan home.
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
            <Link to="/express" className="btn-ghost">
              Shop Express
            </Link>
            <a
              href={waLink(supportContact, 'Hi Chikwafu, I have a question about an appliance')}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-ghost"
            >
              Ask us anything
            </a>
          </motion.div>

          {/* Social-proof stack + two-line trust line (supporting the stats row). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.38 }}
            className="mt-9 flex items-center gap-3.5"
          >
            <div className="flex -space-x-2.5">
              {['JM', 'AK', 'FN', 'DR'].map((initials, i) => (
                <span
                  key={initials}
                  className={cx(
                    'grid h-9 w-9 place-items-center rounded-full border-2 border-bg text-[11px] font-black',
                    i % 2 ? 'bg-accent/25 text-accent' : 'bg-accent text-bg',
                  )}
                  aria-hidden="true"
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-[12.5px] leading-snug">
              <strong className="font-bold text-text">Trusted in 12,400+ homes &amp; businesses</strong>
              <span className="block text-text-muted">Genuine stock · direct pricing · local warranty</span>
            </p>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-9 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-7"
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
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white p-6 shadow-lift sm:p-10">
            <img
              src={hero.image}
              alt={hero.name}
              onError={onPhotoError}
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
              {hero.compareAt && (
                <span className="text-[12px] text-text-dim line-through">{UGX(hero.compareAt)}</span>
              )}
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

/**
 * Monogram partner strip — the brands we stock, each with its role in the
 * catalogue (their wordmarks would need per-brand logo licensing; the monogram
 * tile is the honest, consistent treatment).
 */
function PartnerStrip() {
  const roles: Record<string, string> = {
    Samsung: 'Home & Mobile',
    Hisense: 'Cooling & Laundry',
    JBL: 'Audio Partner',
    Anker: 'Power & Charging',
    Porodo: 'Accessories',
    'Green Lion': 'Lifestyle Tech',
    Apple: 'Computing & Mobile',
    Xiaomi: 'Smart Home',
    Sony: 'Entertainment',
    Hoffmans: 'Kitchen Partner',
  }
  const top = [...new Set(products.map((p) => p.brand))]
    .map((brand) => ({ brand, n: products.filter((p) => p.brand === brand).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)

  return (
    <section className="border-b border-white/10 bg-bg-2 py-10">
      <div className="container-x">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-text-dim">
          Genuine stock partners · sealed, serialised, warranty on every unit
        </p>
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {top.map(({ brand }, i) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-card font-display text-base font-black text-accent">
                {brand[0].toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-text">{brand}</p>
                <p className="truncate text-[11px] text-text-dim">{roles[brand] ?? 'Stock Partner'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Departments() {
  return (
    <section className="container-x py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Direct from our warehouse</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
            Explore by <span className="em">department</span>
          </h2>
          <p className="mt-2 text-[13.5px] text-text-muted">
            {collections.length} departments · genuine stock &amp; warranty-backed
          </p>
        </div>
        <Link
          to="/shop"
          className="group flex items-center gap-2 text-[13.5px] font-semibold text-text transition hover:text-accent"
        >
          View everything
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => {
          const count = products.filter((p) => p.category === c.category).length
          return (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease }}
            >
              <Link
                to={`/shop?category=${encodeURIComponent(c.category)}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    onError={onPhotoError}
                    className="h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-semibold text-text">{c.title}</h3>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-black text-bg">
                      {count} items
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-text-muted">{c.blurb}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent transition-all group-hover:gap-3">
                    Explore <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Value trio — three equal promo cards (bundles / the week's deal / Express),
 * each with eyebrow, headline, blurb, CTA and imagery. Replaces the old promo
 * banner and express band; same destinations, same offer copy and coupon.
 */
function ValueTrio() {
  const deal =
    products.find((x) => x.slug === 'hoffmans-6l-touch-air-fryer') ??
    products.find((x) => x.category === 'Kitchen') ??
    products[0]
  const expressCount = products.filter((p) => p.express).length
  const expressShot = products.find((p) => p.express) ?? deal
  const sets = collections[0]

  const cards = [
    {
      eyebrow: 'Value sets',
      title: (
        <>
          Starter kitchens, <span className="em">packed and priced</span> together.
        </>
      ),
      blurb: 'Cooker, kettle, iron and more — curated sets that cost less than buying piece by piece.',
      cta: 'View sets',
      to: '/shop',
      image: sets.image,
      alt: sets.title,
    },
    {
      eyebrow: "This week's deal",
      title: (
        <>
          Save 16% on the <span className="em">air fryer</span> everyone is talking about.
        </>
      ),
      blurb: `Crisp chips, samosas and a whole chicken on a spoonful of oil. Use code KARIBU10 at checkout for a further 10%.`,
      cta: 'Shop the deal',
      to: `/product/${deal.slug}`,
      image: deal.image,
      alt: deal.name,
      price: deal,
    },
    {
      eyebrow: 'Same-day Kampala',
      title: (
        <>
          Chikwafu <span className="em">Express</span> — on your doorstep in a day.
        </>
      ),
      blurb: `${expressCount} items ship on our fastest routes. Two days across Central, three to four upcountry.`,
      cta: 'See Express items',
      to: '/express',
      image: expressShot.image,
      alt: 'Chikwafu Express delivery',
    },
  ]

  return (
    <section className="container-x py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Built around you</p>
        <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
          More value in every <span className="em">delivery</span>
        </h2>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.article
            key={c.cta}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease }}
            className="flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-card"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={c.image}
                alt={c.alt}
                loading="lazy"
                onError={onPhotoError}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent backdrop-blur">
                {c.eyebrow}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-[19px] font-semibold leading-snug">{c.title}</h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-text-muted">{c.blurb}</p>
              {c.price && (
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="font-display text-xl font-semibold">{UGX(c.price.price)}</span>
                  {c.price.compareAt && (
                    <span className="text-[13px] text-text-dim line-through">{UGX(c.price.compareAt)}</span>
                  )}
                </div>
              )}
              <Link
                to={c.to}
                className="mt-auto inline-flex items-center gap-2 pt-5 text-[13px] font-bold text-accent transition-all hover:gap-3"
              >
                {c.cta} <ArrowRight size={14} />
              </Link>
            </div>
          </motion.article>
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
              This month&apos;s <span className="em">favourites</span>
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

function Bestsellers() {
  const list = products.filter((p) => p.bestseller || p.rating >= 4.5).slice(0, 8)
  const chips = [
    { label: 'All', to: '/shop' },
    { label: 'Kitchen', to: '/shop?category=Kitchen' },
    { label: 'Cooling', to: '/shop?category=Cooling' },
    { label: 'Laundry', to: '/shop?category=Laundry' },
    { label: 'Entertainment', to: '/shop?category=Home%20Entertainment' },
  ]
  return (
    <section className="container-x pb-20 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Moving fast</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
            Kampala&apos;s <span className="em">bestsellers</span> &amp; daily staples
          </h2>
          <p className="mt-2 text-[13.5px] text-text-muted">
            The units Ugandan homes keep coming back for — restocked weekly.
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <Link
            key={c.label}
            to={c.to}
            className={cx(
              'chip',
              i === 0
                ? 'border-accent bg-accent text-bg'
                : 'border-white/15 bg-white/5 text-text-muted hover:border-white/35 hover:text-text',
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-x-5 gap-y-10 grid-cols-2 lg:grid-cols-4">
        {list.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/shop"
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3 text-[13.5px] font-bold text-text transition hover:border-accent hover:text-accent"
        >
          View complete catalogue
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}

/** How-we-work process — numbered steps, guarantee checklist, support CTAs. */
function HowWeWork() {
  const steps = [
    {
      n: 'Step 01',
      t: 'Pick your appliances',
      d: 'Browse by department or search the full catalogue — every listing shows real stock, specs and warranty terms.',
      chips: ['Fridges', 'Cookers', 'Washers', 'TVs', 'Kitchen'],
    },
    {
      n: 'Step 02',
      t: 'Pay how you want',
      d: 'MTN MoMo, Airtel Money, card or cash on delivery. Your order reference lands on WhatsApp the moment it is placed.',
      chips: ['MTN MoMo', 'Airtel Money', 'Card', 'Cash on delivery'],
    },
    {
      n: 'Step 03',
      t: 'Delivery & installation',
      d: 'Same-day in Kampala before 2pm, countrywide after. Our team installs fridges, cookers and washers free of charge.',
      chips: ['Same-day Kampala', 'Countrywide', 'Free install'],
    },
    {
      n: 'Step 04',
      t: "We don't leave until it's right",
      d: 'Every delivery is backed by our warranty promise — faults are handled locally, replacements are arranged fast.',
      chips: ['Local warranty', 'Spare parts', 'Real support'],
    },
  ]
  return (
    <section className="border-y border-white/10 bg-bg-2 py-20">
      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow">Our process</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
            How we work, <span className="em">start to finish</span>
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-text-muted">
            From the first tap to the warranty card — one team, one thread on WhatsApp,
            no juggling contractors.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="grid gap-6 sm:grid-cols-2">
            {steps.map((s, i) => (
              <motion.article
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.55, delay: i * 0.08, ease }}
                className="rounded-2xl border border-white/10 bg-card p-6"
              >
                <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
                  {s.n}
                </span>
                <h3 className="mt-3.5 font-display text-[17px] font-semibold leading-snug">
                  {s.t}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-text-muted">{s.d}</p>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {s.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] font-semibold text-text-muted"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>

          {/* Guarantee card — the "completion checklist" panel. */}
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="flex flex-col rounded-2xl border border-accent/25 bg-card p-7"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-bg">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
                  Completion checklist
                </p>
                <p className="text-[12.5px] text-text-muted">Every order. Every detail.</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3.5">
              {[
                'Order confirmed on WhatsApp',
                'Delivery window agreed',
                'Delivered & installed',
                'Warranty card issued',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[13px] text-text">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-white/10 bg-bg-2 p-4">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-muted">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  <strong className="text-text">Our guarantee:</strong> if it&apos;s not right,
                  we make it right — free collection and replacement on any faulty unit.
                </span>
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
              <Link to="/track" className="btn-primary flex-1">
                Track an order
              </Link>
              <a
                href={waLink(AGENT_WA, 'Hi Chikwafu, I need help with an order')}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ghost flex-1"
              >
                Talk to us
              </a>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  // Pick the three highest-rated reviews across the catalogue, resilient to
  // catalogue changes (no hardcoded indices).
  const picks = products
    .flatMap((p) => p.reviews)
    .filter((r) => r.rating >= 5 && r.body.length > 90)
    .slice(0, 3)
  return (
    <section className="border-y border-white/10 bg-bg-2 py-20">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Testimonials</p>
            <h2 className="mt-2.5 max-w-2xl font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-tight">
              What our <span className="em">customers</span> say
            </h2>
          </div>
          <p className="max-w-xs text-[13px] leading-relaxed text-text-muted">
            Homes and businesses from Ntinda to Arua — verified purchases only.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {picks.map((r, i) => (
            <motion.blockquote
              key={r.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease }}
              className="relative flex flex-col rounded-2xl border border-white/10 bg-card p-6"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-5 top-2 font-display text-6xl font-black leading-none text-accent/15"
              >
                &ldquo;
              </span>
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} size={14} />
                <span className="text-[12px] font-bold text-text-dim">{r.rating.toFixed(1)}</span>
              </div>
              <p className="mt-3.5 font-display text-[17px] font-medium leading-snug text-text">
                &ldquo;{r.title}&rdquo;
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">{r.body}</p>
              <footer className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/12 text-[12.5px] font-bold text-accent">
                  {r.author.split(' ').map((n) => n[0]).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-text">{r.author}</p>
                  <p className="text-[11.5px] text-text-dim">{r.location}</p>
                </div>
                {r.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-accent">
                    <Check size={11} strokeWidth={3} /> Verified
                  </span>
                )}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

function Newsletter() {
  const apiEnabled = useApiEnabled()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (done) return
    if (!apiEnabled) {
      // Static build (no backend): confirm locally, exactly as before.
      setDone(true)
      setMessage('Subscribed ✓ (demo — no server attached)')
      return
    }
    setBusy(true)
    try {
      const res = await api.subscribe(email)
      setDone(true)
      setMessage(res.message)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not subscribe right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container-x py-20">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-card px-7 py-14 text-center grain sm:px-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="eyebrow justify-center">Stay in the loop</p>
          <h2 className="mt-2.5 font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold leading-tight">
            Stay powered, <span className="em">stay updated</span>
          </h2>
          <p className="mx-auto mt-3.5 max-w-md text-[14.5px] leading-relaxed text-text-muted">
            One email a month. Stock alerts, clearance on ex-display units, and nothing else.
          </p>
          <form
            onSubmit={submit}
            className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setMessage('') }}
              placeholder="you@example.com"
              aria-label="Email address"
              disabled={done}
              className="input flex-1 disabled:opacity-60"
            />
            <button type="submit" disabled={busy || done} className="btn-primary shrink-0">
              {busy ? 'Sending…' : done ? 'Subscribed ✓' : 'Subscribe'}
            </button>
          </form>
          {message && (
            <p className={`mt-3 text-[13px] ${done ? 'text-accent' : 'text-danger'}`} role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <PartnerStrip />
      <Departments />
      <ValueTrio />
      <Featured />
      <Bestsellers />
      <HowWeWork />
      <Testimonials />
      <Newsletter />
    </>
  )
}
