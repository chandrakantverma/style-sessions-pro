import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, Clock, Scissors, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { OwnerShop } from "@/hooks/useOwnerShop";

export const NAV_ITEMS = [
  { to: "/dashboard/bookings", label: "Bookings", Icon: CalendarCheck },
  { to: "/dashboard/availability", label: "Availability", Icon: Clock },
  { to: "/dashboard/services", label: "Services", Icon: Scissors },
  { to: "/dashboard/profile", label: "Shop Profile", Icon: Store },
] as const;

type Props = {
  shop: OwnerShop;
  user: User;
  onNavigate?: () => void;
};

export function DashboardNav({ shop, user, onNavigate }: Props) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = (shop.name ?? "S").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{shop.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
