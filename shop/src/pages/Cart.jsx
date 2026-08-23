import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=200&q=80";

export default function Cart() {
  const { items, updateQty, removeFromCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shipping = subtotal > 99 || subtotal === 0 ? 0 : 9.99;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  const goCheckout = () => {
    if (!user) return navigate("/login?redirect=/checkout");
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-ink-400 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-semibold mb-8">Your Cart ({items.length})</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="card p-4 flex items-center gap-4">
              <img src={item.images?.[0] || PLACEHOLDER} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-ink-50" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.name}</p>
                <p className="text-xs text-ink-400">{item.brand}</p>
                <p className="font-bold text-ink-900 mt-1">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center border border-ink-200 rounded-full">
                <button onClick={() => updateQty(item._id, item.qty - 1)} className="p-2">
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                <button onClick={() => updateQty(item._id, item.qty + 1)} className="p-2">
                  <Plus size={13} />
                </button>
              </div>
              <button onClick={() => removeFromCart(item._id)} className="text-ink-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="card p-6 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4">
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
          <button onClick={goCheckout} className="btn-primary w-full py-3.5">
            Checkout <ArrowRight size={16} />
          </button>
          <Link to="/shop" className="block text-center text-sm text-teal-600 font-semibold mt-4">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
