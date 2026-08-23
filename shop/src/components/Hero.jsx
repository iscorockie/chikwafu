import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="container-px pt-10 md:pt-14">
      <div className="relative bg-ink-800 rounded-xl2 overflow-hidden grid md:grid-cols-2 items-center">
        <div className="p-8 md:p-14 text-white z-10">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gold-300 border border-gold-300/40 rounded-full px-3 py-1 mb-5">
            Genuine stock · Warranty included
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold leading-[1.05] mb-5">
Appliances built<br /> <span className="text-gold-300">to outlast the box.</span>
          </h1>
          <p className="text-ink-200 max-w-md mb-8">
            Fridges, cookers, washing machines and kitchen essentials — genuine stock,
            real warranty, priced in shillings. Delivered across Uganda.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <Link to="/shop" className="btn-gold">
              Browse appliances <ArrowRight size={16} />
            </Link>
            <Link to="/shop?flashSale=true" className="btn-secondary bg-transparent border-white/30 text-white hover:border-white">
              See offers
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-200">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-ink-800 bg-gradient-to-br from-gold-300 to-teal-400" />
              ))}
            </div>
            <span>Delivery countrywide</span>
            <span className="flex items-center gap-1 text-gold-300">
              <Star size={14} className="fill-gold-300" /> 4.9/5
            </span>
          </div>
        </div>
        <div className="relative hidden md:block h-full min-h-[420px]">
          <img
            src="https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900&q=80"
            alt="Modern kitchen with home appliances"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-ink-800/70" />
        </div>
        <div className="stamp absolute top-8 right-8 md:top-10 md:right-10 w-20 h-20 border-gold-300 text-gold-300 text-center text-[10px] font-bold uppercase leading-tight bg-ink-800/60">
          Up to<br /><span className="text-lg">50%</span><br />off
        </div>
      </div>
    </section>
  );
}
