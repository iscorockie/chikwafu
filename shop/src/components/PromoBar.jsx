import { Truck } from "lucide-react";

const messages = [
  "Winter Market is live — up to 60% off selected carry",
  "Free shipping on orders over $99",
  "New arrivals dropping every Friday",
  "24/7 support from real humans",
];

export default function PromoBar() {
  const loop = [...messages, ...messages];
  return (
    <div className="bg-ink-900 text-white text-xs md:text-sm overflow-hidden">
      <div className="container-px flex items-center justify-between py-2 gap-4">
        <div className="hidden md:flex items-center gap-1 text-gold-300 shrink-0">
          <Truck size={14} /> Free shipping on orders over $99
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-10 whitespace-nowrap animate-marquee w-max">
            {loop.map((m, i) => (
              <span key={i} className="opacity-90">
                ✦ {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
