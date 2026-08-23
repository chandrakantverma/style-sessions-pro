import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/account")({
  component: AccountPage,
});

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    new_password: z.string().min(6, "Minimum 6 characters"),
    confirm_password: z.string().min(6, "Minimum 6 characters"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "" },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile, profileForm]);

  const saveProfile = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: values.full_name, phone: values.phone || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const [changingPw, setChangingPw] = useState(false);
  async function handlePasswordChange(values: PasswordValues) {
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });
      if (error) throw error;
      toast.success("Password updated");
      passwordForm.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setChangingPw(false);
    }
  }

  const initials = (profile?.full_name ?? user?.email ?? "O")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-lg space-y-8">
      {/* Header */}
      <div>
        <p className="overline">Dashboard</p>
        <h1 className="mt-1 text-4xl">My Account</h1>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-foreground">
            {profile?.full_name ?? "Shop Owner"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-primary" />
            <Badge variant="outline" className="text-[0.65rem] uppercase tracking-[0.15em]">
              Shop Owner
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Separator />

      {/* Personal details */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="size-4 text-primary" />
          <h2 className="text-base font-bold">Personal details</h2>
        </div>

        {profileLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-md" />
            <Skeleton className="h-10 rounded-md" />
          </div>
        ) : (
          <form
            onSubmit={profileForm.handleSubmit((v) => saveProfile.mutate(v))}
            className="panel space-y-4 rounded-lg p-5"
          >
            <div>
              <Label htmlFor="acc-name">Full name *</Label>
              <Input
                id="acc-name"
                className="mt-1.5"
                {...profileForm.register("full_name")}
              />
              {profileForm.formState.errors.full_name && (
                <p className="mt-1 text-xs text-destructive">
                  {profileForm.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="acc-phone">Phone</Label>
              <Input
                id="acc-phone"
                type="tel"
                className="mt-1.5"
                placeholder="+91 98765 43210"
                {...profileForm.register("phone")}
              />
            </div>
            <div>
              <Label htmlFor="acc-email">Email</Label>
              <Input
                id="acc-email"
                type="email"
                className="mt-1.5 opacity-60"
                value={user?.email ?? ""}
                readOnly
                disabled
              />
            </div>
            <Button type="submit" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </div>

      <Separator />

      {/* Change password */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="size-4 text-primary" />
          <h2 className="text-base font-bold">Change password</h2>
        </div>
        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
          className="panel space-y-4 rounded-lg p-5"
        >
          <div>
            <Label htmlFor="acc-new-pw">New password</Label>
            <Input
              id="acc-new-pw"
              type="password"
              className="mt-1.5"
              {...passwordForm.register("new_password")}
            />
            {passwordForm.formState.errors.new_password && (
              <p className="mt-1 text-xs text-destructive">
                {passwordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="acc-confirm-pw">Confirm password</Label>
            <Input
              id="acc-confirm-pw"
              type="password"
              className="mt-1.5"
              {...passwordForm.register("confirm_password")}
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="mt-1 text-xs text-destructive">
                {passwordForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>
          <Button type="submit" variant="outline" disabled={changingPw}>
            {changingPw ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
