import { useState } from "react";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success("You're subscribed! Watch your inbox.");
    setEmail("");
  };

  return (
    <section className="container-px py-16">
      <div className="bg-teal-50 rounded-xl2 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-ink-900">Get Exclusive Offers &amp; Updates</h3>
            <p className="text-sm text-ink-500">Join our newsletter and save more on your favorite products.</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex w-full md:w-auto gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Enter your email address"
            className="flex-1 md:w-64 rounded-full px-5 py-3 text-sm border border-ink-200 outline-none focus:border-teal-500"
          />
          <button className="btn-primary shrink-0">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
