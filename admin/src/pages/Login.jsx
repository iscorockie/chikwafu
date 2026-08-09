import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-10 h-10 rounded-full bg-gold-400 flex items-center justify-center text-ink-900 font-display font-bold">
            C
          </span>
          <span className="font-display text-xl font-semibold">Chikwafu Admin</span>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Admin Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="input"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="input"
          />
          <button disabled={loading} className="btn-primary w-full py-3 justify-center">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-ink-400 bg-ink-50 rounded-lg p-2 mt-4">
          Demo: admin@chikwafu.com / admin123
        </p>
      </div>
    </div>
  );
}
