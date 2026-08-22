import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { CATEGORIES, brands, priceBounds, products } from '../lib/catalog'
import { ProductCard } from '../components/ProductCard'
import { UGX, UGXshort, cx } from '../lib/format'

const SORTS = [
  { v: 'featured', l: 'Featured' },
  { v: 'price-asc', l: 'Price: low to high' },
  { v: 'price-desc', l: 'Price: high to low' },
  { v: 'rating', l: 'Top rated' },
  { v: 'name', l: 'Name A–Z' },
] as const

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const category = params.get('category') ?? ''
  const brand = params.get('brand') ?? ''
  const sort = params.get('sort') ?? 'featured'
  const q = params.get('q') ?? ''
  const minRating = Number(params.get('rating') ?? 0)
  const maxPrice = Number(params.get('max') ?? priceBounds.max)
  const onlyDeals = params.get('deals') === '1'
  const inStock = params.get('stock') === '1'

  const [queryDraft, setQueryDraft] = useState(q)
  useEffect(() => setQueryDraft(q), [q])

  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === '') p.delete(k)
      else p.set(k, v)
    })
    setParams(p, { replace: true })
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (queryDraft !== q) patch({ q: queryDraft || null })
    }, 280)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryDraft])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category && p.category !== category) return false
      if (brand && p.brand !== brand) return false
      if (p.price > maxPrice) return false
      if (minRating && p.rating < minRating) return false
      if (onlyDeals && !p.compareAt) return false
      if (inStock && p.stock <= 0) return false
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.tagline} ${p.description}`.toLowerCase()
        if (!q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false
      }
      return true
    })
    list = [...list]
    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'rating': list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount); break
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break
      default:
        list.sort(
          (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.rating - a.rating,
        )
    }
    return list
  }, [category, brand, sort, q, minRating, maxPrice, onlyDeals, inStock])

  const activeCount = [category, brand, q, minRating ? '1' : '', onlyDeals ? '1' : '', inStock ? '1' : '',
    maxPrice < priceBounds.max ? '1' : ''].filter(Boolean).length

  const clearAll = () => setParams(sort !== 'featured' ? { sort } : {}, { replace: true })

  const FilterPanel = (
    <div className="space-y-8">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">Category</h3>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button
            onClick={() => patch({ category: null })}
            className={cx('chip', !category ? 'border-ink bg-ink text-cream' : 'border-ink/15 text-ink-500 hover:border-ink/40')}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => patch({ category: category === c ? null : c })}
              className={cx('chip', category === c ? 'border-ink bg-ink text-cream' : 'border-ink/15 text-ink-500 hover:border-ink/40')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">Brand</h3>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => patch({ brand: brand === b ? null : b })}
              className={cx('chip', brand === b ? 'border-copper bg-copper text-white' : 'border-ink/15 text-ink-500 hover:border-ink/40')}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">Max price</h3>
          <span className="text-[12.5px] font-semibold tabular-nums text-copper">
            {UGXshort(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={10000}
          value={maxPrice}
          onChange={(e) => patch({ max: e.target.value === String(priceBounds.max) ? null : e.target.value })}
          aria-label="Maximum price"
          className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-copper
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-copper
                     [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-125"
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-300">
          <span>{UGXshort(priceBounds.min)}</span>
          <span>{UGXshort(priceBounds.max)}</span>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">Rating</h3>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {[4.5, 4, 0].map((r) => (
            <button
              key={r}
              onClick={() => patch({ rating: r ? String(r) : null })}
              className={cx('chip gap-1', minRating === r ? 'border-ink bg-ink text-cream' : 'border-ink/15 text-ink-500 hover:border-ink/40')}
            >
              {r ? (<><Star size={11} className="fill-current" /> {r}+</>) : 'Any'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-ink/8 pt-6">
        {[
          { k: 'deals', on: onlyDeals, l: 'On offer only' },
          { k: 'stock', on: inStock, l: 'In stock only' },
        ].map((t) => (
          <label key={t.k} className="flex cursor-pointer items-center gap-3 text-[13.5px] text-ink-500">
            <span className="relative inline-flex">
              <input
                type="checkbox"
                checked={t.on}
                onChange={(e) => patch({ [t.k]: e.target.checked ? '1' : null })}
                className="peer sr-only"
              />
              <span className="h-5 w-9 rounded-full bg-cream-300 transition peer-checked:bg-copper" />
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </span>
            {t.l}
          </label>
        ))}
      </div>

      {activeCount > 0 && (
        <button onClick={clearAll} className="btn-ghost w-full">
          <X size={15} /> Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="container-x py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-2.5 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-semibold leading-tight">
          {category || 'All appliances'}
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-500">
          Every unit is genuine stock with a local warranty. Prices include VAT — delivery is
          calculated at checkout.
        </p>
      </header>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            placeholder="Search fridges, kettles, 4K TVs…"
            aria-label="Search products"
            className="input pl-11"
          />
          {queryDraft && (
            <button
              onClick={() => setQueryDraft('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-300 transition hover:bg-ink/5 hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="btn-ghost relative shrink-0 lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
            {activeCount > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-copper px-1 text-[10.5px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => patch({ sort: e.target.value === 'featured' ? null : e.target.value })}
            aria-label="Sort products"
            className="input w-full cursor-pointer sm:w-[210px]"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[92px]">{FilterPanel}</div>
        </aside>

        <div>
          <div className="flex items-center justify-between border-b border-ink/8 pb-4">
            <p className="text-[13px] text-ink-500">
              <strong className="text-ink">{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'product' : 'products'}
              {q && <> for “<strong className="text-ink">{q}</strong>”</>}
            </p>
            {maxPrice < priceBounds.max && (
              <p className="text-[12.5px] text-ink-300">Up to {UGX(maxPrice)}</p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-cream-200">
                <Search size={26} className="text-ink-300" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold">Nothing matched that</p>
                <p className="mt-1.5 text-[14px] text-ink-500">
                  Try widening your price range or clearing a filter.
                </p>
              </div>
              <button onClick={clearAll} className="btn-primary mt-1">Clear filters</button>
            </div>
          ) : (
            <motion.div
              layout
              className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[90] max-h-[86vh] overflow-y-auto rounded-t-[26px] bg-cream p-6 pb-10 shadow-lift lg:hidden"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/15" />
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Filters</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-ink/5"
                >
                  <X size={19} />
                </button>
              </div>
              {FilterPanel}
              <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-7 w-full">
                Show {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
