import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./DashboardNav";
import type { User } from "@supabase/supabase-js";
import type { OwnerShop } from "@/hooks/useOwnerShop";

type Props = {
  shop: OwnerShop;
  user: User;
};

export function DashboardMobileNav({ shop, user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <DashboardNav shop={shop} user={user} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
