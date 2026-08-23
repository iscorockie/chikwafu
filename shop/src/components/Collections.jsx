import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    title: "The Kitchen",
    sub: "Cookers, microwaves, blenders and air fryers",
    img: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=700&q=80",
    to: "/shop?category=Kitchen",
    theme: "dark",
  },
  {
    title: "Cold Storage",
    sub: "Fridges and freezers built for Ugandan power",
    img: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=700&q=80",
    to: "/shop?category=Cooling",
    theme: "light",
  },
];

export default function Collections() {
  return (
    <section className="container-px py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ink-900">Featured Collections</h2>
        <Link to="/shop" className="text-sm font-semibold text-teal-600 hover:underline">
          View All Collections →
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {collections.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className="relative rounded-xl2 overflow-hidden h-56 group"
          >
            <img src={c.img} alt={c.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className={`absolute inset-0 ${c.theme === "dark" ? "bg-ink-900/60" : "bg-gradient-to-t from-black/60 to-transparent"}`} />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-xl font-semibold mb-1">{c.title}</h3>
              <p className="text-sm text-white/80 mb-3">{c.sub}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold bg-white text-ink-900 rounded-full px-4 py-2">
                Shop Collection <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
