import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const links = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/categories" },
  { label: "Deals", to: "/shop?flashSale=true" },
  { label: "New Arrivals", to: "/shop?newArrival=true" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink-100">
      <div className="container-px flex items-center justify-between h-20 gap-6">
        <div className="flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center text-gold-300 font-display font-bold">
              C
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink-900">Chikwafu</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-ink-700">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className="hover:text-ink-900 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="hidden md:flex items-center flex-1 max-w-sm bg-ink-50 rounded-full px-4 py-2.5">
          <Search size={16} className="text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for products…"
            className="bg-transparent outline-none px-2 text-sm flex-1"
          />
        </form>

        <div className="flex items-center gap-4 text-ink-800">
          <Link to={user ? "/account" : "/login"} className="hidden sm:flex items-center gap-1 text-sm hover:text-gold-600">
            <User size={20} />
          </Link>
          <Link to="/wishlist" className="relative">
            <Heart size={20} />
            {wishCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold-400 text-ink-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-ink-100 px-5 py-4 space-y-3">
          <form onSubmit={onSearch} className="flex items-center bg-ink-50 rounded-full px-4 py-2.5 mb-2">
            <Search size={16} className="text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="bg-transparent outline-none px-2 text-sm flex-1"
            />
          </form>
          {links.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-medium py-1">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
