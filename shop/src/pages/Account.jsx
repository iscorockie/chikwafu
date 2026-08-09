import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Package } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusColor = {
  pending: "bg-gold-100 text-gold-700",
  processing: "bg-teal-100 text-teal-700",
  shipped: "bg-ink-100 text-ink-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Account() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  useEffect(() => {
    if (user) api.get("/orders/mine").then((r) => setOrders(r.data));
  }, [user]);

  if (!user) return null;

  return (
    <div className="container-px py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
          <p className="text-sm text-ink-400">{user.email}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="btn-secondary text-sm py-2"
        >
          <LogOut size={15} /> Log Out
        </button>
      </div>

      <h2 className="font-semibold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">
          <Package className="mx-auto mb-3" />
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="card p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-sm">Order #{o._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${statusColor[o.status]}`}>{o.status}</span>
              </div>
              <div className="text-sm text-ink-500 space-y-1 mb-3">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {it.name} × {it.qty}
                    </span>
                    <span>${(it.price * it.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t border-ink-100 pt-3">
                <span>Total</span>
                <span>${o.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
