import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "";
  const newArrival = params.get("newArrival") || "";
  const flashSale = params.get("flashSale") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products", {
        params: { search, category, sort, newArrival, flashSale, minPrice, maxPrice, limit: 24 },
      })
      .then((r) => {
        setProducts(r.data.products);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, newArrival, flashSale, minPrice, maxPrice]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const clearFilters = () => setParams({});

  return (
    <div className="container-px py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            {flashSale ? "Flash Deals" : newArrival ? "New Arrivals" : search ? `Results for "${search}"` : "All Products"}
          </h1>
          <p className="text-sm text-ink-400">{loading ? "Loading…" : `${total} products`}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="border border-ink-200 rounded-full px-4 py-2 text-sm outline-none"
          >
            <option value="">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary py-2 px-4 text-sm lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-teal-600 font-semibold">
                Clear
              </button>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase text-ink-400 mb-2">Category</p>
              <div className="space-y-1.5">
                <button
                  onClick={() => setParam("category", "")}
                  className={`block text-sm w-full text-left ${!category ? "text-teal-600 font-semibold" : "text-ink-600"}`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setParam("category", c._id)}
                    className={`block text-sm w-full text-left ${category === c._id ? "text-teal-600 font-semibold" : "text-ink-600"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-ink-400 mb-2">Price</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setParam("minPrice", e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                />
                <span className="text-ink-400">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setParam("maxPrice", e.target.value)}
                  className="w-full border border-ink-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </aside>

        <div>
          {(search || category || newArrival || flashSale) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {search && <Chip label={`Search: ${search}`} onClear={() => setParam("search", "")} />}
              {category && (
                <Chip
                  label={`Category: ${categories.find((c) => c._id === category)?.name || ""}`}
                  onClear={() => setParam("category", "")}
                />
              )}
              {newArrival && <Chip label="New Arrivals" onClear={() => setParam("newArrival", "")} />}
              {flashSale && <Chip label="Flash Sale" onClear={() => setParam("flashSale", "")} />}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card aspect-[3/4] animate-pulse bg-ink-100" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-ink-400">
              <p className="font-semibold text-ink-700 mb-1">No products found</p>
              <p className="text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-ink-50 text-ink-700 text-xs font-semibold px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onClear}>
        <X size={12} />
      </button>
    </span>
  );
}
