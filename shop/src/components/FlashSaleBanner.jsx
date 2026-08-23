import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

function useCountdown(hours = 48) {
  const [target] = useState(() => Date.now() + hours * 3600 * 1000);
  const [left, setLeft] = useState(target - Date.now());

  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return { d, h, m, s };
}

export default function FlashSaleBanner() {
  const { d, h, m, s } = useCountdown(50);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section className="container-px py-6">
      <div className="bg-ink-900 rounded-xl2 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
        <div className="text-white z-10">
          <span className="inline-flex items-center gap-1 text-gold-300 text-xs font-bold uppercase tracking-widest mb-3">
            <Zap size={14} className="fill-gold-300" /> Flash Sale
          </span>
          <h3 className="text-2xl md:text-3xl font-semibold mb-2">Up to 70% Off</h3>
          <p className="text-ink-300 text-sm mb-5">Limited time offer on selected appliances.</p>
          <div className="flex gap-3 mb-6">
            {[["Days", d], ["Hours", h], ["Mins", m], ["Secs", s]].map(([label, val]) => (
              <div key={label} className="bg-white/10 rounded-lg px-3 py-2 text-center min-w-[56px]">
                <div className="font-bold text-lg leading-none">{pad(val)}</div>
                <div className="text-[10px] text-ink-300 mt-1 uppercase">{label}</div>
              </div>
            ))}
          </div>
          <Link to="/shop?flashSale=true" className="btn-gold">
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
        <div className="stamp w-28 h-28 border-gold-300 text-gold-300 text-center leading-tight bg-white/5 shrink-0 z-10">
          <div>
            <div className="text-xs font-bold">Up to</div>
            <div className="text-2xl font-bold">70%</div>
            <div className="text-xs font-bold">OFF</div>
          </div>
        </div>
      </div>
    </section>
  );
}
