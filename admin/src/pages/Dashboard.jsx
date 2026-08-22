import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, Banknote, Clock, Package, ShoppingCart, TrendingUp,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import api from "../lib/api";
import { StatCard } from "../components/UI";
import { UGX, UGXshort } from "../lib/money";

const STATUS_TINT = {
  pending: "#d99a2b",
  processing: "#3b9edb",
  shipped: "#8b6fd6",
  delivered: "#179e85",
  cancelled: "#d64545",
};

/** Orders are UGX; the API returns whole shillings. */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get("/orders/stats"),
      api.get("/orders"),
      api.get("/products?limit=500"),
    ])
      .then(([s, o, p]) => {
        if (!alive) return;
        setStats(s.data);
        setOrders(Array.isArray(o.data) ? o.data : []);
        const list = Array.isArray(p.data) ? p.data : p.data?.products || p.data?.items || [];
        setProducts(list);
      })
      .catch((e) => alive && setError(e?.response?.data?.message || e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  /* ── revenue over the last 14 days ─────────────────────────────── */
  const daily = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toDateString();
      const total = orders
        .filter((o) => o.status !== "cancelled" && new Date(o.createdAt).toDateString() === key)
        .reduce((s, o) => s + (o.totalPrice || 0), 0);
      days.push({
        name: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        total,
      });
    }
    return days;
  }, [orders]);

  const statusData = useMemo(
    () => (stats?.statusCounts || []).map((s) => ({ name: s._id, count: s.count })),
    [stats],
  );

  /* ── best sellers, computed from real order lines ──────────────── */
  const topSellers = useMemo(() => {
    const tally = new Map();
    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) =>
        (o.items || []).forEach((l) => {
          const id = String(l.product || l.name);
          const cur = tally.get(id) || { name: l.name, qty: 0, revenue: 0 };
          cur.qty += l.qty || 0;
          cur.revenue += (l.price || 0) * (l.qty || 0);
          tally.set(id, cur);
        }),
      );
    return [...tally.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [orders]);

  /* ── low stock ─────────────────────────────────────────────────── */
  const lowStock = useMemo(
    () => products.filter((p) => (p.stock ?? 0) <= 10).sort((a, b) => a.stock - b.stock).slice(0, 8),
    [products],
  );

  const revenue = stats?.totalRevenue || 0;
  const pending = stats?.statusCounts?.find((s) => s._id === "pending")?.count || 0;
  const processing = stats?.statusCounts?.find((s) => s._id === "processing")?.count || 0;
  const paidOrders = (stats?.statusCounts || [])
    .filter((s) => s._id !== "cancelled")
    .reduce((n, s) => n + s.count, 0);
  const aov = paidOrders ? revenue / paidOrders : 0;
  const stockValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);

  if (error) {
    return (
      <div className="card p-6 border-l-4 border-red-500">
        <h1 className="text-lg font-semibold mb-1">Could not load the dashboard</h1>
        <p className="text-sm text-ink-400">{error}</p>
        <p className="text-sm text-ink-400 mt-2">
          Check the API is running and <code>VITE_API_URL</code> points at it.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-ink-400 mb-8">
        {loading ? "Loading…" : `Trading summary across ${stats?.totalOrders ?? 0} orders. All figures in UGX.`}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={Banknote} label="Revenue" value={UGXshort(revenue)} tint="teal" />
        <StatCard icon={ShoppingCart} label="Orders to action" value={pending + processing} tint="gold" />
        <StatCard icon={TrendingUp} label="Average order" value={UGXshort(aov)} tint="ink" />
        <StatCard icon={Package} label="Products" value={stats?.totalProducts ?? "—"} tint="red" />
      </div>

      {/* Revenue trend */}
      <div className="card p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold">Revenue, last 14 days</h3>
          <span className="text-sm text-ink-400">{UGX(revenue)} all time</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={daily} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#179e85" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#179e85" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(v) => UGXshort(v).replace("UGX ", "")}
            />
            <Tooltip
              formatter={(v) => [UGX(v), "Revenue"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #eee", fontSize: 13 }}
            />
            <Area type="monotone" dataKey="total" stroke="#179e85" strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 mb-6">
        {/* Orders by status */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Orders by status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee", fontSize: 13 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((s) => (
                  <Cell key={s.name} fill={STATUS_TINT[s.name] || "#179e85"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock */}
        <div className="card p-6">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <AlertTriangle size={16} className="text-gold-600" />
            Low stock
          </h3>
          <p className="text-xs text-ink-400 mb-4">
            {lowStock.length
              ? `${lowStock.length} line${lowStock.length === 1 ? "" : "s"} at or below 10 units`
              : "Nothing running low."}
          </p>
          <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
            {lowStock.map((p) => (
              <div key={p._id} className="flex items-center gap-3">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover bg-ink-50" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-ink-50" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.brand}</p>
                </div>
                <span
                  className={`badge shrink-0 ${
                    p.stock <= 5 ? "bg-red-50 text-red-600" : "bg-gold-50 text-gold-600"
                  }`}
                >
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Best sellers */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Best sellers by revenue</h3>
          {topSellers.length === 0 && <p className="text-sm text-ink-400">No sales yet.</p>}
          <div className="space-y-3">
            {topSellers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-ink-50 text-ink-600 text-xs font-bold grid place-items-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.qty} sold</p>
                </div>
                <span className="text-sm font-bold text-teal-600 shrink-0">{UGXshort(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent orders</h3>
            <Link to="/orders" className="text-xs font-semibold text-teal-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-sm text-ink-400">No orders yet.</p>}
            {orders.slice(0, 6).map((o) => (
              <div
                key={o._id}
                className="flex items-center justify-between text-sm border-b border-ink-50 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold">#{o._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-ink-400 truncate">
                    {o.shippingAddress?.fullName || o.user?.name || "Customer"}
                    {o.shippingAddress?.region ? ` · ${o.shippingAddress.region}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold">{UGX(o.totalPrice)}</p>
                  <span className="badge bg-ink-50 text-ink-600">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory footnote */}
      {products.length > 0 && (
        <p className="text-xs text-ink-400 mt-6">
          {products.length} products · {products.reduce((s, p) => s + (p.stock || 0), 0)} units on hand ·{" "}
          <strong className="text-ink-600">{UGX(stockValue)}</strong> stock value at retail
        </p>
      )}
    </div>
  );
}
