import { Truck, RotateCcw, ShieldCheck, Headset } from "lucide-react";

const items = [
  { icon: Truck, title: "Free Delivery", sub: "Kampala, on orders over UGX 1.5M" },
  { icon: RotateCcw, title: "Easy Returns", sub: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Checkout", sub: "100% secure payment" },
  { icon: Headset, title: "24/7 Support", sub: "We're here to help" },
];

export default function TrustBadges() {
  return (
    <section className="container-px py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-ink-100 py-8">
        {items.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-ink-900">{title}</p>
              <p className="text-xs text-ink-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
