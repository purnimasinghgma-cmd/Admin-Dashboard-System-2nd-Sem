import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl font-bold text-[var(--color-brand)]">404</div>
      <div className="mt-2 text-lg font-semibold">Page not found</div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
