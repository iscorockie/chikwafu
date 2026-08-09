import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Modal } from "../components/UI";

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
const statusColor = {
  pending: "bg-gold-100 text-gold-700",
  processing: "bg-teal-100 text-teal-700",
  shipped: "bg-ink-100 text-ink-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/orders").then((r) => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success("Order status updated");
      load();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-48">
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o._id} className="cursor-pointer hover:bg-ink-50/50" onClick={() => setSelected(o)}>
                  <td className="font-semibold">#{o._id.slice(-8).toUpperCase()}</td>
                  <td>
                    <p>{o.user?.name}</p>
                    <p className="text-xs text-ink-400">{o.user?.email}</p>
                  </td>
                  <td>{o.items.length} item(s)</td>
                  <td className="font-semibold">${o.totalPrice.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${statusColor[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="text-ink-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title={`Order #${selected._id.slice(-8).toUpperCase()}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase text-ink-400 mb-1">Customer</p>
              <p className="text-sm">{selected.user?.name} — {selected.user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-ink-400 mb-1">Shipping Address</p>
              <p className="text-sm text-ink-600">
                {selected.shippingAddress?.fullName}, {selected.shippingAddress?.line1}, {selected.shippingAddress?.city}, {selected.shippingAddress?.country}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-ink-400 mb-2">Items</p>
              <div className="space-y-1 text-sm">
                {selected.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{it.name} × {it.qty}</span>
                    <span>${(it.price * it.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between font-bold border-t border-ink-100 pt-3">
              <span>Total</span>
              <span>${selected.totalPrice.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-ink-400 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected._id, s)}
                    className={`badge border ${selected.status === s ? statusColor[s] : "border-ink-200 text-ink-500"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
