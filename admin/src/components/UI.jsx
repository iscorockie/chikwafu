import { X } from "lucide-react";

export function StatCard({ icon: Icon, label, value, tint = "teal" }) {
  const tints = {
    teal: "bg-teal-50 text-teal-600",
    gold: "bg-gold-50 text-gold-600",
    ink: "bg-ink-50 text-ink-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tints[tint]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-ink-400 font-semibold">{label}</p>
        <p className="text-2xl font-bold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
