import { cn } from "../lib/utils.js";

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && (
          <div className="text-xs text-[var(--color-muted)]">{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
