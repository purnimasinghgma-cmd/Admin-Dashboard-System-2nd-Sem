import { cn } from "../lib/utils.js";

const STYLES = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  shipped: "bg-blue-100 text-blue-800",
  refunded: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-200 text-slate-700",
  active: "bg-emerald-100 text-emerald-800",
  invited: "bg-blue-100 text-blue-800",
  suspended: "bg-rose-100 text-rose-800",
  admin: "bg-violet-100 text-violet-800",
  manager: "bg-blue-100 text-blue-800",
  user: "bg-slate-100 text-slate-700",
};

export default function Badge({ children, variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STYLES[variant] || "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}
