import { Link } from "@tanstack/react-router";
import {
  Menu,
  CalendarCheck,
  LayoutDashboard,
  Scissors,
  Clock,
  Store,
  LogOut,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRole } from "@/hooks/useOwnerRole";

// Public nav (unauthenticated)
const PUBLIC_NAV = [
  { to: "/styles", label: "Styles" },
  { to: "/shops", label: "Shops" },
  { to: "/pricing", label: "For Owners" },
];

// Customer nav links
const CUSTOMER_NAV = [
  { to: "/shops", label: "Browse Shops", Icon: Scissors },
  { to: "/styles", label: "Styles", Icon: Scissors },
  { to: "/my-bookings", label: "My Bookings", Icon: CalendarCheck },
  { to: "/profile", label: "Profile", Icon: UserCircle },
];

// Owner nav links — all inside dashboard
const OWNER_NAV = [
  { to: "/dashboard/bookings", label: "Bookings", Icon: CalendarCheck },
  { to: "/dashboard/availability", label: "Availability", Icon: Clock },
  { to: "/dashboard/services", label: "Services", Icon: Scissors },
  { to: "/dashboard/profile", label: "Shop Profile", Icon: Store },
  { to: "/dashboard/account", label: "My Account", Icon: UserCircle },
];

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isOwner, isLoading: roleLoading } = useOwnerRole();
  const [open, setOpen] = useState(false);

  // Don't show role-specific nav until role is resolved — avoids flash
  const roleReady = !roleLoading;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo — owners go to dashboard, customers/guests go home */}
        <Link
          to={roleReady && user && isOwner ? "/dashboard" : "/"}
          className="display text-2xl leading-none tracking-widest"
        >
          Blade<span className="text-primary">room</span>
        </Link>

        {/* ── Desktop nav ─────────────────────────────────────────── */}
        <nav className="hidden items-center gap-8 md:flex">
          {!user ? (
            // Public: Styles · Shops · For Owners
            PUBLIC_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))
          ) : isOwner ? (
            // Owner nav: dashboard sections
            OWNER_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))
          ) : (
            // Customer nav: shops · styles · my bookings
            CUSTOMER_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))
          )}
        </nav>

        {/* ── Desktop actions ──────────────────────────────────────── */}
        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/shops">Book a chair</Link>
              </Button>
            </>
          ) : isOwner ? (
            <>
              <Button asChild size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1.5 size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="mr-1.5 size-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm">
                <Link to="/my-bookings">
                  <CalendarCheck className="mr-1.5 size-4" />
                  My Bookings
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="mr-1.5 size-4" />
                Sign out
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border bg-card px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {!user ? (
              <>
                {PUBLIC_NAV.map((item) => (
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
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="text-sm font-bold uppercase tracking-[0.2em] text-primary"
                >
                  Sign in
                </Link>
              </>
            ) : isOwner ? (
              <>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Shop Owner
                </p>
                {OWNER_NAV.map(({ to, label, Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => { setOpen(false); void signOut(); }}
                  className="flex items-center gap-2 text-left text-sm font-bold uppercase tracking-[0.2em] text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Customer
                </p>
                {CUSTOMER_NAV.map(({ to, label, Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => { setOpen(false); void signOut(); }}
                  className="flex items-center gap-2 text-left text-sm font-bold uppercase tracking-[0.2em] text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
