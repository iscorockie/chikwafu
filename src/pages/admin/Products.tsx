import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, ExternalLink, ImagePlus, Search, X, Zap } from 'lucide-react'
import { uploadToR2 } from '../../lib/api'
import { CATEGORIES, brands, products } from '../../lib/catalog'
import { useAdminData } from '../../store/adminData'
import { UGX, cx } from '../../lib/format'

type SortKey = 'name' | 'price' | 'stock' | 'rating' | 'sold'

export default function AdminProducts() {
  const { orders } = useAdminData()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [brand, setBrand] = useState('')
  const [sort, setSort] = useState<SortKey>('sold')
  const [asc, setAsc] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  const handleImageUpload = async (file?: File) => {
    if (!file) return
    setUploading(true); setUploadError('')
    try { setUploadedUrl((await uploadToR2(file)).url) }
    catch (e) { setUploadError(e instanceof Error ? e.message : 'Upload failed') }
    finally { setUploading(false) }
  }

  const soldMap = useMemo(() => {
    const m = new Map<string, number>()
    orders.filter((o) => o.status !== 'cancelled').forEach((o) =>
      o.items.forEach((l) => m.set(l.productId, (m.get(l.productId) ?? 0) + l.qty)),
    )
    return m
  }, [orders])

  const rows = useMemo(() => {
    let list = products.filter((p) => {
      if (cat && p.category !== cat) return false
      if (brand && p.brand !== brand) return false
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
    const dir = asc ? 1 : -1
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price': return (a.price - b.price) * dir
        case 'stock': return (a.stock - b.stock) * dir
        case 'rating': return (a.rating - b.rating) * dir
        case 'sold': return ((soldMap.get(a.id) ?? 0) - (soldMap.get(b.id) ?? 0)) * dir
        default: return a.name.localeCompare(b.name) * dir
      }
    })
    return list
  }, [q, cat, brand, sort, asc, soldMap])

  const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0)

  const th = (key: SortKey, label: string, align = 'left') => (
    <th className={cx('px-5 py-3.5', align === 'right' && 'text-right')}>
      <button
        onClick={() => { sort === key ? setAsc(!asc) : (setSort(key), setAsc(false)) }}
        className={cx(
          'inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition',
          sort === key ? 'text-accent' : 'text-text-dim hover:text-text',
        )}
      >
        {label}
        <ArrowUpDown size={11} />
      </button>
    </th>
  )

  return (
    <div>
      <header className="mb-7">
        <p className="eyebrow">Inventory</p>
        <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.5rem)] font-black leading-tight">
          Products
        </h1>
        <p className="mt-2 text-[13.5px] text-text-muted">
          {products.length} lines · {products.reduce((s, p) => s + p.stock, 0)} units on hand ·{' '}
          <strong className="text-text">{UGX(stockValue)}</strong> stock value at retail
        </p>
      </header>

      <div className="mb-5 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4">
        <div className="flex flex-wrap items-center gap-3"><ImagePlus size={19} className="text-accent" /><div className="flex-1"><p className="text-sm font-bold">Upload product media</p><p className="text-xs text-text-muted">PNG, JPG or WebP · stored securely in Cloudflare R2</p></div><label className="btn-primary cursor-pointer px-4 py-2 text-xs">{uploading ? 'Uploading…' : 'Choose image'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => handleImageUpload(e.target.files?.[0])} /></label></div>
        {uploadedUrl && <p className="mt-3 break-all rounded-lg bg-bg px-3 py-2 text-xs text-accent">Uploaded URL: {uploadedUrl}</p>}
        {uploadError && <p className="mt-2 text-xs text-danger">{uploadError}</p>}
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="input pl-11"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-dim hover:bg-white/10"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input lg:w-[200px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input lg:w-[170px]">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-dim">
                  Product
                </th>
                {th('price', 'Price', 'right')}
                {th('stock', 'Stock', 'right')}
                {th('sold', 'Sold', 'right')}
                {th('rating', 'Rating', 'right')}
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const sold = soldMap.get(p.id) ?? 0
                return (
                  <tr key={p.id} className="border-b border-white/6 last:border-0 hover:bg-white/4">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt=""
                          loading="lazy"
                          className="h-11 w-11 shrink-0 rounded-lg bg-white object-cover"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-bold text-text">{p.name}</span>
                            {p.express && <Zap size={11} className="shrink-0 fill-accent text-accent" />}
                          </div>
                          <span className="text-[11.5px] text-text-muted">
                            {p.brand} · {p.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-black tabular-nums">
                      {UGX(p.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cx(
                        'inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums',
                        p.stock <= 5 ? 'border-danger/30 bg-danger/15 text-danger'
                          : p.stock <= 10 ? 'border-amber-400/30 bg-amber-400/15 text-amber-300'
                          : 'border-white/12 bg-white/6 text-text-muted',
                      )}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] tabular-nums text-text-muted">
                      {sold}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] tabular-nums text-text-muted">
                      {p.rating.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/product/${p.slug}`}
                        title="View on storefront"
                        className="inline-grid h-8 w-8 place-items-center rounded-full text-text-dim transition hover:bg-white/10 hover:text-accent"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-card py-16 text-center">
          <p className="font-display text-lg font-black">Nothing matched</p>
          <p className="mt-1.5 text-[13.5px] text-text-muted">Try clearing a filter.</p>
        </div>
      )}
    </div>
  )
}
