import { Link } from 'react-router-dom'
import { Heart, ArrowLeft } from 'lucide-react'
import { products } from '../lib/catalog'
import { useWishlist } from '../store/wishlist'
import { ProductCard } from '../components/ProductCard'

export default function Favorites() {
  const ids = useWishlist((s) => s.ids)
  const saved = products.filter((p) => ids.includes(p.id))
  return <div className="container-x py-12 lg:py-16">
    <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent"><ArrowLeft size={15}/> Continue shopping</Link>
    <div className="mt-7 flex items-end justify-between gap-4"><div><p className="eyebrow">Your collection</p><h1 className="mt-2 text-4xl">Favorites</h1><p className="mt-2 text-sm text-text-muted">{saved.length} saved appliance{saved.length === 1 ? '' : 's'}</p></div><Heart className="hidden text-accent sm:block" size={34}/></div>
    {saved.length ? <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"><>{saved.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</></div> : <div className="mt-10 rounded-2xl border border-white/10 bg-card px-6 py-20 text-center"><Heart className="mx-auto text-text-dim" size={34}/><h2 className="mt-4 text-xl">Nothing saved yet</h2><p className="mt-2 text-sm text-text-muted">Tap the heart on any appliance to keep it here.</p><Link to="/shop" className="btn-primary mt-6">Explore appliances</Link></div>}
  </div>
}
