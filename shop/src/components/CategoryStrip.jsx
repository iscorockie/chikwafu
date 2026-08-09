import { Link } from "react-router-dom";
import { Backpack, Headphones, Watch, Wallet, Gamepad2, Glasses, Luggage, Speaker, Grid3x3 } from "lucide-react";

const iconMap = {
  backpack: Backpack,
  headphones: Headphones,
  watch: Watch,
  wallet: Wallet,
  gamepad: Gamepad2,
  glasses: Glasses,
  luggage: Luggage,
  speaker: Speaker,
};

export default function CategoryStrip({ categories = [] }) {
  return (
    <section className="container-px py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ink-900">Shop by Category</h2>
        <Link to="/categories" className="text-sm font-semibold text-teal-600 hover:underline">
          View All Categories →
        </Link>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
        {categories.slice(0, 8).map((c) => {
          const Icon = iconMap[c.icon] || Grid3x3;
          return (
            <Link
              key={c._id}
              to={`/shop?category=${c._id}`}
              className="card flex flex-col items-center justify-center gap-2 py-6 hover:shadow-lift hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <p className="text-xs font-semibold text-center">{c.name}</p>
              <p className="text-[10px] text-ink-400">{c.itemCount}+ Items</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
