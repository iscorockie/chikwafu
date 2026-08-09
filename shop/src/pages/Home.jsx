import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import Hero from "../components/Hero";
import TrustBadges from "../components/TrustBadges";
import CategoryStrip from "../components/CategoryStrip";
import ProductCard from "../components/ProductCard";
import FlashSaleBanner from "../components/FlashSaleBanner";
import Collections from "../components/Collections";
import Newsletter from "../components/Newsletter";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/categories"),
      api.get("/products", { params: { featured: true, limit: 4 } }),
      api.get("/products", { params: { newArrival: true, limit: 4 } }),
    ])
      .then(([c, f, a]) => {
        setCategories(c.data);
        setFeatured(f.data.products);
        setArrivals(a.data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Hero />
      <TrustBadges />
      <CategoryStrip categories={categories} />

      <section className="container-px py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-ink-900">Featured Products</h2>
          <Link to="/shop" className="text-sm font-semibold text-teal-600 hover:underline">
            View All Products →
          </Link>
        </div>
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      <FlashSaleBanner />
      <Collections />

      <section className="container-px py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-ink-900">New Arrivals</h2>
          <Link to="/shop?newArrival=true" className="text-sm font-semibold text-teal-600 hover:underline">
            View All →
          </Link>
        </div>
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {arrivals.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      <Newsletter />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card aspect-[3/4] animate-pulse bg-ink-100" />
      ))}
    </div>
  );
}
