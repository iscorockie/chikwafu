import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Package, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../lib/api";
import { StatCard } from "../components/UI";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/stats").then((r) => setStats(r.data));
    api.get("/orders").then((r) => setOrders(r.data.slice(0, 6)));
  }, []);

  const chartData = stats?.statusCounts?.map((s) => ({ name: s._id, count: s.count })) || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-ink-400 mb-8">Overview of your store's performance</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} tint="teal" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.totalOrders ?? "—"} tint="gold" />
        <StatCard icon={Package} label="Total Products" value={stats?.totalProducts ?? "—"} tint="ink" />
        <StatCard icon={Clock} label="Pending Orders" value={stats?.statusCounts?.find((s) => s._id === "pending")?.count || 0} tint="red" />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#179e85" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-sm text-ink-400">No orders yet.</p>}
            {orders.map((o) => (
              <div key={o._id} className="flex items-center justify-between text-sm border-b border-ink-50 pb-3">
                <div>
                  <p className="font-semibold">#{o._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-ink-400">{o.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${o.totalPrice.toFixed(2)}</p>
                  <span className="badge bg-ink-50 text-ink-600">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
