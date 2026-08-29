"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Mail, Shield, Eye, EyeOff, Sun, Moon, LayoutDashboard } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { updateProfile, changePassword } from "@/features/authentication/services/auth";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SettingRow } from "@/components/shared/SettingRow";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: LayoutDashboard },
];

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSaveProfile = async (data: ProfileFormData) => {
    setMessage(null);
    try {
      await updateProfile(data);
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile. Please try again." });
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    setMessage(null);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setMessage({ type: "success", text: "Password updated successfully" });
      passwordForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update password. Please try again." });
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isLoading = authLoading || profileForm.formState.isSubmitting || passwordForm.formState.isSubmitting;

  return (
    <div className="max-w-[1000px] space-y-6">
      {message && (
        <Alert variant={message.type === "success" ? "default" : "destructive"} className="gap-2">
          <AlertDescription className="text-sm">{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <SectionHeading
          title="Profile Information"
          description="Update your personal details"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      className="pl-10"
                      {...profileForm.register("firstName")}
                      disabled={isLoading}
                    />
                  </div>
                  {profileForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive" role="alert">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      className="pl-10"
                      {...profileForm.register("lastName")}
                      disabled={isLoading}
                    />
                  </div>
                  {profileForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive" role="alert">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...profileForm.register("email")}
                    disabled={isLoading}
                  />
                </div>
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <SettingRow
                  icon={Sun}
                  label="Theme"
                  description="Choose how the interface is displayed"
                  control={
                    <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1" role="radiogroup" aria-label="Theme">
                      {themeOptions.map((option) => {
                        const isActive = theme === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => setTheme(option.value)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  }
                />
              </div>

              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={isLoading}>
                  {profileForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <SectionHeading
          title="Security"
          description="Update your password"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading font-semibold">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      className="pl-10 pr-10"
                      {...passwordForm.register("currentPassword")}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive" role="alert">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 8 characters)"
                      className="pl-10 pr-10"
                      {...passwordForm.register("newPassword")}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive" role="alert">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    {...passwordForm.register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive" role="alert">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={isLoading}>
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardFooter className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:bg-transparent sm:border-0 sm:px-6 sm:pt-0">
          <div>
            <p className="font-medium">Sign out of all sessions</p>
            <p className="text-sm text-muted-foreground">
              This will log you out from all devices and clear your session
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout} disabled={isLoading || isLoggingOut}>
            {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Out Everywhere
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
