import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Star, Minus, Plus, ShoppingBag, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

const PLACEHOLDER = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();

  const load = () => {
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      api
        .get("/products", { params: { category: r.data.category._id, limit: 4 } })
        .then((rr) => setRelated(rr.data.products.filter((p) => p._id !== r.data._id)));
    });
  };

  useEffect(() => {
    load();
    setQty(1);
    window.scrollTo(0, 0);
  }, [slug]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in to leave a review");
    try {
      await api.post(`/products/${product._id}/reviews`, reviewForm);
      toast.success("Review submitted");
      setReviewForm({ rating: 5, comment: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit review");
    }
  };

  if (!product) {
    return <div className="container-px py-24 text-center text-ink-400">Loading product…</div>;
  }

  const img = product.images?.[0] || PLACEHOLDER;

  return (
    <div className="container-px py-10">
      <div className="text-xs text-ink-400 mb-6 flex gap-1.5">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span className="text-ink-700">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        <div className="rounded-xl2 overflow-hidden bg-ink-50 aspect-square">
          <img src={img} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-ink-400 tracking-wide">{product.brand}</p>
          <h1 className="text-3xl font-semibold mt-1 mb-3 text-ink-900">{product.name}</h1>
          <div className="flex items-center gap-2 text-sm mb-5">
            <div className="flex text-gold-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} className={i < Math.round(product.rating) ? "fill-gold-400" : "text-ink-200"} />
              ))}
            </div>
            <span className="text-ink-400">
              {product.rating?.toFixed(1)} ({product.numReviews} reviews)
            </span>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-ink-900">${product.price?.toFixed(2)}</span>
            {product.compareAtPrice > 0 && (
              <>
                <span className="text-lg text-ink-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                <span className="badge bg-teal-500 text-white">-{product.discountPercent}%</span>
              </>
            )}
          </div>
          <p className="text-ink-500 text-sm leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-ink-200 rounded-full">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3">
                <Plus size={14} />
              </button>
            </div>
            <span className="text-sm text-ink-400">{product.stock} in stock</span>
          </div>

          <div className="flex gap-3 mb-8">
            <button onClick={() => addToCart(product, qty)} className="btn-primary flex-1 py-3.5">
              <ShoppingBag size={16} /> Add to Cart
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className="w-14 h-14 rounded-full border border-ink-200 flex items-center justify-center shrink-0"
            >
              <Heart size={18} className={isWishlisted(product._id) ? "fill-gold-400 text-gold-400" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs text-ink-500">
            <div className="flex flex-col items-center gap-1.5 text-center border border-ink-100 rounded-xl p-3">
              <Truck size={16} className="text-teal-500" /> Free Shipping
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center border border-ink-100 rounded-xl p-3">
              <RotateCcw size={16} className="text-teal-500" /> 30-Day Returns
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center border border-ink-100 rounded-xl p-3">
              <ShieldCheck size={16} className="text-teal-500" /> Secure Checkout
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mb-16">
        <h2 className="text-xl font-semibold mb-5">Customer Reviews</h2>
        <div className="space-y-4 mb-8">
          {product.reviews?.length === 0 && <p className="text-sm text-ink-400">No reviews yet. Be the first!</p>}
          {product.reviews?.map((r) => (
            <div key={r._id} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{r.name}</p>
                <div className="flex text-gold-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < r.rating ? "fill-gold-400" : "text-ink-200"} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-ink-500">{r.comment}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitReview} className="card p-5">
          <p className="font-semibold text-sm mb-3">Write a review</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                <Star size={20} className={n <= reviewForm.rating ? "fill-gold-400 text-gold-400" : "text-ink-200"} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Share your thoughts…"
            required
            className="w-full border border-ink-200 rounded-xl p-3 text-sm outline-none mb-3"
            rows={3}
          />
          <button className="btn-primary">Submit Review</button>
        </form>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-5">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
