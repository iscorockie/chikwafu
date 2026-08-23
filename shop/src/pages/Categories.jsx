import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Refrigerator, CookingPot, WashingMachine, Tv, Zap, Smartphone, Laptop, Grid3x3 } from "lucide-react";
import api from "../lib/api";

const iconMap = {
  kitchen: CookingPot,
  cooling: Refrigerator,
  laundry: WashingMachine,
  "home entertainment": Tv,
  "small appliances": Zap,
  "phones & tablets": Smartphone,
  computing: Laptop,
};

export default function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-semibold mb-8">All Categories</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((c) => {
          const Icon = iconMap[String(c.icon || c.name || "").toLowerCase()] || Grid3x3;
          return (
            <Link
              key={c._id}
              to={`/shop?category=${c._id}`}
              className="card flex flex-col items-center justify-center gap-3 py-10 hover:shadow-lift hover:-translate-y-0.5 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center">
                <Icon size={24} />
              </div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-ink-400">{c.itemCount}+ Items</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
