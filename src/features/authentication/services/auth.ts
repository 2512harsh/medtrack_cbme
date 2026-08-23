import type { UserSummary, UserRole } from "@/types";

export async function login(email: string, password: string): Promise<UserSummary> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? "Invalid email or password");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<UserSummary | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  return res.json();
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case "Super Admin":
      return "/dashboard/super-admin";
    case "Dean":
      return "/dashboard/dean";
    case "HOD":
      return "/dashboard/dean";
    case "Faculty":
      return "/dashboard/faculty";
    case "Student":
      return "/dashboard/student";
    default:
      return "/dashboard/student";
  }
}
