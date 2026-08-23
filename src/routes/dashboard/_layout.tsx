import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRole } from "@/hooks/useOwnerRole";
import { useOwnerShop } from "@/hooks/useOwnerShop";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { OnboardingCreateShop } from "@/components/dashboard/OnboardingCreateShop";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/_layout")({
  component: DashboardGuard,
});

function DashboardSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="hidden w-60 border-r border-border md:block">
        <Skeleton className="m-4 h-12 rounded-lg" />
        <div className="space-y-2 p-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 rounded-md" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="mt-4 h-64 rounded-lg" />
      </div>
    </div>
  );
}

function DashboardGuard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isOwner, isLoading: roleLoading, error: roleError } = useOwnerRole();
  const { shop, isLoading: shopLoading } = useOwnerShop(isOwner);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [authLoading, user, navigate]);

  // Redirect on role check error
  useEffect(() => {
    if (roleError) {
      toast.error(
        roleError instanceof Error
          ? roleError.message
          : "Access check failed. Please sign in again.",
      );
      void navigate({ to: "/auth", replace: true });
    }
  }, [roleError, navigate]);

  // Redirect non-owners
  useEffect(() => {
    if (!roleLoading && user && !isOwner && !roleError) {
      void navigate({ to: "/my-bookings", replace: true });
    }
  }, [roleLoading, user, isOwner, roleError, navigate]);

  const isLoading = authLoading || roleLoading || (isOwner && shopLoading);

  if (isLoading) return <DashboardSkeleton />;
  if (!user || !isOwner) return null;

  // First-time owner: show onboarding
  if (!shop) return <OnboardingCreateShop />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border md:flex md:flex-col">
        <DashboardNav shop={shop} user={user} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <DashboardMobileNav shop={shop} user={user} />
          <span className="display text-xl tracking-widest">
            Blade<span className="text-primary">room</span>
          </span>
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
