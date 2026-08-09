import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", line1: "", line2: "", city: "", country: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal > 99 ? 0 : 9.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/orders", {
        items: items.map((i) => ({ product: i._id, qty: i.qty })),
        shippingAddress: form,
        paymentMethod,
      });
      clearCart();
      toast.success("Order placed successfully!");
      navigate("/account");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-semibold mb-8">Checkout</h1>
      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="fullName" required onChange={onChange} placeholder="Full Name" className="input" />
              <input name="phone" required onChange={onChange} placeholder="Phone Number" className="input" />
              <input name="line1" required onChange={onChange} placeholder="Address Line 1" className="input md:col-span-2" />
              <input name="line2" onChange={onChange} placeholder="Address Line 2 (optional)" className="input md:col-span-2" />
              <input name="city" required onChange={onChange} placeholder="City" className="input" />
              <input name="country" required onChange={onChange} placeholder="Country" className="input" />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4">Payment Method</h2>
            <div className="space-y-2">
              {[
                { id: "cash_on_delivery", label: "Cash on Delivery" },
                { id: "card", label: "Credit / Debit Card" },
                { id: "mobile_money", label: "Mobile Money" },
              ].map((m) => (
                <label key={m.id} className="flex items-center gap-3 border border-ink-200 rounded-xl p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {items.map((i) => (
              <div key={i._id} className="flex justify-between text-sm">
                <span className="text-ink-500 truncate pr-2">
                  {i.name} × {i.qty}
                </span>
                <span className="font-semibold shrink-0">${(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-ink-100 pt-4 mb-4">
            <div className="flex justify-between text-ink-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-ink-100 pt-4 mb-6">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button disabled={submitting} className="btn-primary w-full py-3.5">
            {submitting ? "Placing Order…" : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
