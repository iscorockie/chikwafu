import { Link } from "react-router-dom";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const img = product.images?.[0] || PLACEHOLDER;

  return (
    <div className="card group overflow-hidden hover:shadow-lift transition-shadow">
      <Link to={`/product/${product.slug}`} className="block relative aspect-square bg-ink-50 overflow-hidden">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.discountPercent > 0 && (
          <span className="absolute top-3 left-3 badge bg-teal-500 text-white">-{product.discountPercent}%</span>
        )}
        {product.isNewArrival && !product.discountPercent && (
          <span className="absolute top-3 left-3 badge bg-ink-800 text-white">New</span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-card"
        >
          <Heart size={15} className={isWishlisted(product._id) ? "fill-gold-400 text-gold-400" : "text-ink-500"} />
        </button>
      </Link>
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-ink-400 font-semibold">{product.brand}</p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-sm mt-0.5 line-clamp-2 hover:text-teal-600">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-500">
          <Star size={12} className="fill-gold-400 text-gold-400" />
          <span>{product.rating?.toFixed(1) || "0.0"}</span>
          <span>({product.numReviews || 0})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-ink-900">${product.price?.toFixed(2)}</span>
            {product.compareAtPrice > 0 && (
              <span className="text-xs text-ink-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => addToCart(product, 1)}
          className="mt-3 w-full btn-primary py-2.5 text-sm"
        >
          <ShoppingBag size={15} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
