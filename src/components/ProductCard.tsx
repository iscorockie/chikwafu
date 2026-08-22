import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '../lib/types'
import { UGX, cx } from '../lib/format'
import { Stars } from './Stars'
import { useCart } from '../store/cart'
import { useWishlist } from '../store/wishlist'

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add)
  const wishIds = useWishlist((s) => s.ids)
  const toggleWish = useWishlist((s) => s.toggle)
  const wished = wishIds.includes(product.id)
  const off = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.07]"
            />
          </div>
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-bg shadow-sm">
              −{off}%
            </span>
          )}
          {product.badges.map((b) => (
            <span
              key={b}
              className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text shadow-sm backdrop-blur ring-1 ring-white/15"
            >
              {b}
            </span>
          ))}
        </div>

        <button
          onClick={() => toggleWish(product.id)}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={wished}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-text ring-1 ring-white/15 backdrop-blur transition hover:scale-110 hover:bg-black/80"
        >
          <Heart size={16} className={cx(wished && 'fill-accent text-accent')} />
        </button>

        {product.stock <= 10 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold text-text ring-1 ring-white/12 backdrop-blur">
            Only {product.stock} left
          </span>
        )}

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
          <button
            onClick={() => add(product.id)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-text shadow-lift backdrop-blur transition hover:bg-accent"
          >
            <ShoppingBag size={14} /> Add to cart
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-dim">
          <span>{product.brand}</span>
          <span className="h-1 w-1 rounded-full bg-bg-2-300" />
          <span>{product.category}</span>
        </div>
        <h3 className="mt-1.5 font-display text-[17px] font-semibold leading-snug text-text">
          <Link to={`/product/${product.slug}`} className="transition hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] text-text-muted">{product.tagline}</p>

        <div className="mt-2 flex items-center gap-2">
          <Stars rating={product.rating} size={13} />
          <span className="text-[12px] text-text-dim">
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-display text-lg font-semibold text-text">{UGX(product.price)}</span>
          {product.compareAt && (
            <span className="text-[13px] text-text-dim line-through">{UGX(product.compareAt)}</span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
