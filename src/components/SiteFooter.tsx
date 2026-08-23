import { Link } from "@tanstack/react-router";

const FOOTER_LINKS = {
  Customers: [
    { to: "/shops", label: "Find a shop" },
    { to: "/styles", label: "Browse styles" },
    { to: "/my-bookings", label: "My bookings" },
    { to: "/auth", label: "Sign in" },
  ],
  "Shop Owners": [
    { to: "/pricing", label: "Owner plans" },
    { to: "/auth", label: "Open your shop" },
    { to: "/dashboard", label: "Dashboard" },
  ],
} as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-[1fr_auto_auto]">
          {/* Brand */}
          <div>
            <Link to="/" className="display text-2xl tracking-widest">
              Blade<span className="text-primary">room</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Men-only barbershop booking. Pick a chair, lock a slot, show up sharp.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Bladeroom. All rights reserved.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {section}
              </p>
              <ul className="mt-4 space-y-2.5">
                {links.map(({ to, label }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
