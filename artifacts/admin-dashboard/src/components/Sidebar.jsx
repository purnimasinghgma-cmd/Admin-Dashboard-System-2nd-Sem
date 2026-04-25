import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Users as UsersIcon,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  Boxes,
} from "lucide-react";
import { useCurrentUser } from "../hooks/useAuth.js";
import { cn } from "../lib/utils.js";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
  { href: "/sales", label: "Sales", icon: ShoppingCart, roles: ["admin", "manager", "user"] },
  { href: "/users", label: "Users", icon: UsersIcon, roles: ["admin"] },
  { href: "/products", label: "Products", icon: Package, roles: ["admin", "manager", "user"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "manager"] },
  { href: "/settings", label: "Settings", icon: SettingsIcon, roles: ["admin", "manager", "user"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { role } = useCurrentUser();
  const items = NAV.filter((n) => !role || n.roles.includes(role));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--color-border)] bg-[#0f172a] text-slate-100 md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold">NexusOps</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            Admin Console
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-400">
        v1.0.0 · School Project
      </div>
    </aside>
  );
}
