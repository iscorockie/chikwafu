import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px py-16 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2 text-center">Create Account</h1>
      <p className="text-sm text-ink-400 text-center mb-8">Join Chikwafu for faster checkout</p>
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <input name="name" required onChange={onChange} placeholder="Full Name" className="input" />
        <input name="email" type="email" required onChange={onChange} placeholder="Email" className="input" />
        <input name="phone" onChange={onChange} placeholder="Phone (optional)" className="input" />
        <input name="password" type="password" required minLength={6} onChange={onChange} placeholder="Password" className="input" />
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>
      <p className="text-center text-sm text-ink-500 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-teal-600 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
