import { Bell, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useCurrentUser, useSwitchRole } from "../hooks/useAuth.js";

const TITLES = {
  "/": "Dashboard",
  "/sales": "Sales",
  "/users": "Users",
  "/products": "Products",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export default function Topbar() {
  const [location] = useLocation();
  const { user, role } = useCurrentUser();
  const switchRole = useSwitchRole();
  const title = TITLES[location] || "Not Found";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      <h1 className="text-lg font-semibold text-[var(--color-text)]">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 md:flex">
          <Search className="h-4 w-4 text-[var(--color-muted)]" />
          <input
            placeholder="Search..."
            className="w-48 bg-transparent text-sm placeholder:text-[var(--color-muted)] focus:outline-none"
          />
        </div>
        <select
          value={role || "admin"}
          onChange={(e) => switchRole.mutate(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium capitalize"
          disabled={switchRole.isPending}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <button className="relative rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-bg)]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full border border-[var(--color-border)] bg-white"
            />
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium leading-tight">
                {user.name}
              </div>
              <div className="text-xs capitalize text-[var(--color-muted)]">
                {user.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
