import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate(params.get("redirect") || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px py-16 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2 text-center">Welcome Back</h1>
      <p className="text-sm text-ink-400 text-center mb-8">Log in to continue to Chikwafu</p>
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
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
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <p className="text-center text-xs text-ink-400 bg-ink-50 rounded-lg p-2">
          Demo admin: admin@chikwafu.com / admin123
        </p>
      </form>
      <p className="text-center text-sm text-ink-500 mt-6">
        New here?{" "}
        <Link to="/register" className="text-teal-600 font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
