import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/users", label: "Users", icon: Users },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-ink-900 text-white flex flex-col shrink-0 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 h-20 border-b border-white/10">
        <span className="w-9 h-9 rounded-full bg-gold-400 flex items-center justify-center text-ink-900 font-display font-bold">
          C
        </span>
        <div>
          <p className="font-display font-semibold leading-none">Chikwafu</p>
          <p className="text-[10px] text-ink-300 uppercase tracking-wide">Admin</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-gold-400 text-ink-900" : "text-ink-200 hover:bg-white/10"
              }`
            }
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]}
          </div>
          <div className="text-xs">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-ink-400 truncate max-w-[130px]">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-ink-200 hover:text-white w-full">
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </aside>
  );
}
