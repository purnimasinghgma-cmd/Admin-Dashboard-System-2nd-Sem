import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="text-base font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 text-xs font-medium text-[var(--color-muted)]">
        {label}
      </div>
      {children}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none"
    >
      {children}
    </select>
  );
}

export function Button({ variant = "primary", children, ...props }) {
  const styles = {
    primary:
      "bg-[var(--color-brand)] text-white hover:bg-blue-700 disabled:opacity-50",
    secondary:
      "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-bg)]",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50",
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
