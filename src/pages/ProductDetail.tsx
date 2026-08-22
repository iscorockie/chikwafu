import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck, ChevronRight, Heart, Minus, Package, Plus, RotateCcw,
  ShieldCheck, ShoppingBag, Truck, Wrench, Zap,
} from 'lucide-react'
import { getProduct, products } from '../lib/catalog'
import { UGX, cx } from '../lib/format'
import { Stars } from '../components/Stars'
import { ProductCard } from '../components/ProductCard'
import { useCart } from '../store/cart'
import { useWishlist } from '../store/wishlist'

const ease = [0.22, 1, 0.36, 1] as const

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const product = getProduct(slug)
  const add = useCart((s) => s.add)
  const wishIds = useWishlist((s) => s.ids)
  const toggleWish = useWishlist((s) => s.toggle)
  const [shot, setShot] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [reviewFilter, setReviewFilter] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setShot(0); setQty(1); setTab('desc'); setReviewFilter(0)
  }, [slug])

  const related = useMemo(
    () =>
      product
        ? products
            .filter((p) => p.id !== product.id)
            .sort((a, b) =>
              Number(b.category === product.category) - Number(a.category === product.category) ||
              b.rating - a.rating)
            .slice(0, 4)
        : [],
    [product],
  )

  const dist = useMemo(() => {
    if (!product) return []
    return [5, 4, 3, 2, 1].map((star) => {
      const n = product.reviews.filter((r) => Math.round(r.rating) === star).length
      return { star, n, pct: product.reviews.length ? (n / product.reviews.length) * 100 : 0 }
    })
  }, [product])

  if (!product) return <Navigate to="/shop" replace />

  const wished = wishIds.includes(product.id)
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0
  const g = product.gallery[shot]
  const shownReviews = reviewFilter
    ? product.reviews.filter((r) => Math.round(r.rating) === reviewFilter)
    : product.reviews

  const handleAdd = () => {
    add(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="pb-4">
      <nav aria-label="Breadcrumb" className="container-x pt-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-300">
          <li><Link to="/" className="transition hover:text-copper">Home</Link></li>
          <ChevronRight size={13} />
          <li><Link to="/shop" className="transition hover:text-copper">Shop</Link></li>
          <ChevronRight size={13} />
          <li>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="transition hover:text-copper"
            >
              {product.category}
            </Link>
          </li>
          <ChevronRight size={13} />
          <li className="truncate text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="container-x mt-7 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-[92px] lg:self-start">
          <div className="relative overflow-hidden rounded-[24px] bg-cream-200">
            <AnimatePresence mode="wait">
              <motion.img
                key={shot}
                src={product.image}
                alt={`${product.name} — ${g.label}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                style={{ transform: `scale(${g.zoom})`, objectPosition: g.pos }}
                className="aspect-square w-full object-cover"
              />
            </AnimatePresence>
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-copper px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow">
                Save {off}%
              </span>
            )}
            <button
              onClick={() => toggleWish(product.id)}
              aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow backdrop-blur transition hover:scale-110"
            >
              <Heart size={18} className={cx(wished && 'fill-copper text-copper')} />
            </button>
          </div>

          <div className="mt-3.5 grid grid-cols-4 gap-3">
            {product.gallery.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setShot(i)}
                aria-label={`View ${s.label}`}
                className={cx(
                  'group relative overflow-hidden rounded-xl bg-cream-200 transition-all duration-300',
                  shot === i ? 'ring-2 ring-copper ring-offset-2 ring-offset-cream' : 'opacity-65 hover:opacity-100',
                )}
              >
                <img
                  src={product.image}
                  alt=""
                  style={{ transform: `scale(${s.zoom})`, objectPosition: s.pos }}
                  className="aspect-square w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-[9.5px] font-medium uppercase tracking-wider text-cream backdrop-blur-sm">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2.5 text-[11.5px] uppercase tracking-[0.18em] text-ink-300">
            <span className="font-semibold text-copper">{product.brand}</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>{product.category}</span>
          </div>

          <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.08]">
            {product.name}
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-500">{product.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Stars rating={product.rating} size={16} />
            <span className="text-[13.5px] font-medium">{product.rating.toFixed(1)}</span>
            <button
              onClick={() => {
                setTab('reviews')
                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="text-[13px] text-ink-500 underline underline-offset-4 transition hover:text-copper"
            >
              {product.reviewCount} reviews
            </button>
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-moss">
              <BadgeCheck size={14} /> Verified stock
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-[34px] font-semibold leading-none">
              {UGX(product.price)}
            </span>
            {product.compareAt && (
              <>
                <span className="text-lg text-ink-300 line-through">{UGX(product.compareAt)}</span>
                <span className="rounded-full bg-copper/12 px-2.5 py-1 text-[12px] font-semibold text-copper">
                  You save {UGX(product.compareAt - product.price)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-[12.5px] text-ink-300">VAT inclusive · Delivery at checkout</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Zap, l: 'Power', v: product.powerWatts ? `${product.powerWatts}W` : '—' },
              { icon: Package, l: 'Capacity', v: product.capacity ?? '—' },
              { icon: ShieldCheck, l: 'Warranty', v: `${product.warrantyMonths} mo` },
              { icon: Truck, l: 'Dispatch', v: 'Same day' },
            ].map(({ icon: Icon, l, v }) => (
              <div key={l} className="rounded-xl border border-ink/8 bg-white p-3">
                <Icon size={15} className="text-copper" />
                <p className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-ink-300">{l}</p>
                <p className="text-[13px] font-semibold">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-ink/15 bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="grid h-12 w-12 place-items-center rounded-full transition hover:bg-cream-200"
              >
                <Minus size={15} />
              </button>
              <span className="w-9 text-center font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock}
                aria-label="Increase quantity"
                className="grid h-12 w-12 place-items-center rounded-full transition hover:bg-cream-200 disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>

            <button onClick={handleAdd} className="btn-primary h-12 flex-1 min-w-[200px] text-[14px]">
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2"
                  >
                    <BadgeCheck size={17} /> Added to cart
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag size={17} /> Add to cart — {UGX(product.price * qty)}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          <a
            href={`https://wa.me/256780844098?text=${encodeURIComponent(
              `Hello Chikwafu, I'd like to order the ${product.name} (${UGX(product.price)}). Is it in stock?`,
            )}`}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost mt-3 w-full text-[13.5px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.44 9.44 0 01-4.81-1.32l-.35-.2-3.57.94.95-3.49-.22-.36a9.42 9.42 0 01-1.44-5.03c0-5.21 4.24-9.45 9.46-9.45 2.53 0 4.9.99 6.68 2.78a9.38 9.38 0 012.77 6.68c0 5.21-4.24 9.45-9.46 9.45zM20.46 3.54A11.75 11.75 0 0012.05 0C5.55 0 .26 5.29.26 11.79c0 2.08.54 4.11 1.58 5.9L.16 24l6.45-1.69a11.76 11.76 0 005.44 1.38h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.23-6.11-3.45-8.34z" />
            </svg>
            Ask about this on WhatsApp
          </a>

          <div className="mt-3.5 flex items-center gap-2 text-[13px]">
            <span className={cx('h-2 w-2 rounded-full', product.stock > 10 ? 'bg-moss' : 'bg-copper')} />
            {product.stock > 10 ? (
              <span className="text-moss">In stock — ships today from Ntinda</span>
            ) : (
              <span className="text-copper">Only {product.stock} left in the showroom</span>
            )}
          </div>

          <ul className="mt-7 grid gap-3 rounded-2xl border border-ink/8 bg-white p-5">
            {[
              { icon: Truck, t: 'Free Kampala delivery over UGX 1.5M', s: 'Upcountry from UGX 45,000' },
              { icon: Wrench, t: 'Installation by our technicians', s: 'Free on large appliances' },
              { icon: RotateCcw, t: '7-day return window', s: 'Unopened, with receipt' },
            ].map(({ icon: Icon, t, s }) => (
              <li key={t} className="flex items-start gap-3">
                <Icon size={16} className="mt-0.5 shrink-0 text-copper" />
                <div>
                  <p className="text-[13.5px] font-medium">{t}</p>
                  <p className="text-[12.5px] text-ink-300">{s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section id="reviews" className="container-x mt-20 scroll-mt-24">
        <div className="flex gap-1 overflow-x-auto border-b border-ink/10 hide-scrollbar">
          {([
            ['desc', 'Description'],
            ['specs', 'Specifications'],
            ['reviews', `Reviews (${product.reviewCount})`],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cx(
                'relative whitespace-nowrap px-5 py-3.5 text-[13.5px] font-medium transition-colors',
                tab === k ? 'text-ink' : 'text-ink-300 hover:text-ink-500',
              )}
            >
              {label}
              {tab === k && (
                <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-copper" />
              )}
            </button>
          ))}
        </div>

        <div className="py-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              {tab === 'desc' && (
                <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
                  <div>
                    <p className="max-w-2xl text-[15px] leading-[1.75] text-ink-500">
                      {product.description}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-6">
                    <h3 className="font-display text-lg font-semibold">Why people choose it</h3>
                    <ul className="mt-4 space-y-3">
                      {product.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-500">
                          <BadgeCheck size={15} className="mt-0.5 shrink-0 text-copper" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {tab === 'specs' && (
                <div className="max-w-2xl overflow-hidden rounded-2xl border border-ink/8 bg-white">
                  <dl>
                    {product.specs.map((s, i) => (
                      <div
                        key={s.label}
                        className={cx(
                          'flex flex-wrap items-baseline justify-between gap-2 px-6 py-4',
                          i % 2 === 1 && 'bg-cream/60',
                        )}
                      >
                        <dt className="text-[13px] uppercase tracking-[0.1em] text-ink-300">{s.label}</dt>
                        <dd className="text-[14px] font-medium text-ink">{s.value}</dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-2 px-6 py-4">
                      <dt className="text-[13px] uppercase tracking-[0.1em] text-ink-300">Colour</dt>
                      <dd className="text-[14px] font-medium text-ink">{product.colour}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
                  <div className="lg:sticky lg:top-[100px] lg:self-start">
                    <div className="rounded-2xl bg-white p-6 text-center">
                      <p className="font-display text-5xl font-semibold">{product.rating.toFixed(1)}</p>
                      <Stars rating={product.rating} size={17} className="mt-2 justify-center" />
                      <p className="mt-2 text-[12.5px] text-ink-300">
                        Based on {product.reviewCount} reviews
                      </p>
                      <div className="mt-5 space-y-1.5">
                        {dist.map((d) => (
                          <button
                            key={d.star}
                            onClick={() => setReviewFilter(reviewFilter === d.star ? 0 : d.star)}
                            className="flex w-full items-center gap-2.5 text-[12px] transition hover:opacity-75"
                          >
                            <span className={cx('w-3 tabular-nums', reviewFilter === d.star && 'font-bold text-copper')}>
                              {d.star}
                            </span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-300">
                              <motion.span
                                initial={{ width: 0 }}
                                animate={{ width: `${d.pct}%` }}
                                transition={{ duration: 0.7, ease }}
                                className="block h-full rounded-full bg-copper"
                              />
                            </span>
                            <span className="w-4 text-right tabular-nums text-ink-300">{d.n}</span>
                          </button>
                        ))}
                      </div>
                      {reviewFilter > 0 && (
                        <button
                          onClick={() => setReviewFilter(0)}
                          className="mt-4 text-[12px] text-copper underline underline-offset-4"
                        >
                          Show all reviews
                        </button>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {shownReviews.map((r, i) => (
                      <motion.li
                        key={r.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                        className="rounded-2xl border border-ink/8 bg-white p-6"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-copper/12 text-[13px] font-bold text-copper">
                              {r.author.split(' ').map((n) => n[0]).join('')}
                            </span>
                            <div>
                              <p className="text-[13.5px] font-semibold">{r.author}</p>
                              <p className="text-[11.5px] text-ink-300">{r.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Stars rating={r.rating} size={13} />
                            <p className="mt-1 text-[11.5px] text-ink-300">
                              {new Date(r.date).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 font-display text-[16px] font-semibold">{r.title}</p>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{r.body}</p>
                        {r.verified && (
                          <p className="mt-3.5 flex items-center gap-1.5 text-[11.5px] font-medium text-moss">
                            <BadgeCheck size={13} /> Verified purchase
                          </p>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="font-display text-[clamp(1.6rem,3.2vw,2.3rem)] font-semibold">
          You may also like
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
