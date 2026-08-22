import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/styles", label: "Styles" },
  { to: "/shops", label: "Shops" },
  { to: "/pricing", label: "For Owners" },
];

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="display text-2xl leading-none tracking-widest">
          Blade<span className="text-primary">room</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/my-bookings">My Bookings</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => void signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/shops">Book a chair</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? "/my-bookings" : "/auth"}
              onClick={() => setOpen(false)}
              className="text-sm font-bold uppercase tracking-[0.2em] text-primary"
            >
              {user ? "My Bookings" : "Sign in"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
