import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    api.get("/products", { params: { limit: 100 } }).then((r) => {
      setProducts(r.data.products.filter((p) => ids.includes(p._id)));
      setLoading(false);
    });
  }, [ids]);

  if (!loading && products.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="text-2xl font-semibold mb-2">Your wishlist is empty</h1>
        <p className="text-ink-400 mb-6">Save items you love for later.</p>
        <Link to="/shop" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-semibold mb-8">Your Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
