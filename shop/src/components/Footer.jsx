import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-100 mt-24">
      <div className="container-px py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-full bg-gold-400 flex items-center justify-center text-ink-900 font-display font-bold">
              C
            </span>
            <span className="font-display text-xl font-semibold text-white">Chikwafu</span>
          </div>
          <p className="text-sm text-ink-300 max-w-xs">
            Genuine home appliances with real warranty — fridges, cookers, washers, TVs and kitchen essentials. Delivered across Uganda.
          </p>
          <div className="flex gap-3 mt-5">
            {[Instagram, Twitter, Facebook, Mail].map((Icon, i) => (
              <span key={i} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold-400 hover:text-ink-900 transition-colors cursor-pointer">
                <Icon size={16} />
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><Link to="/shop">All Products</Link></li>
            <li><Link to="/shop?newArrival=true">New Arrivals</Link></li>
            <li><Link to="/shop?flashSale=true">Flash Deals</Link></li>
            <li><Link to="/categories">Categories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm">Support</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li>Track Order</li>
            <li>Returns &amp; Exchanges</li>
            <li>Shipping Info</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li>About Chikwafu</li>
            <li>Careers</li>
            <li>Journal</li>
            <li>Wholesale</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} Chikwafu. All rights reserved.
      </div>
    </footer>
  );
}
