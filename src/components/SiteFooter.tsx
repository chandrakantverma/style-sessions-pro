import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="display text-xl tracking-widest">
          Blade<span className="text-primary">room</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Men&apos;s grooming, booked properly. &copy; {new Date().getFullYear()}
        </p>
        <Link
          to="/pricing"
          className="text-xs font-bold uppercase tracking-[0.2em] text-primary"
        >
          Run a shop?
        </Link>
      </div>
    </footer>
  );
}
