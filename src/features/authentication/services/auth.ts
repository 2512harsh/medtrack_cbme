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

export interface RegisterOptions {
  institutions: { id: string; name: string }[];
  batches: { id: string; name: string; institutionId: string; streamId: string }[];
  professionalYears: { id: string; name: string; streamId: string; sequence: number }[];
}

export async function getRegisterOptions(): Promise<RegisterOptions> {
  const res = await fetch("/api/auth/register/options");
  if (!res.ok) throw new Error("Could not load registration options");
  return res.json();
}

export interface StudentRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rollNumber: string;
  registrationNumber: string;
  institutionId: string;
  batchId: string;
  professionalYearId: string;
}

export async function registerStudent(data: StudentRegistration): Promise<void> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? "Registration failed");
  }
}

export async function getCurrentUser(): Promise<UserSummary | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  return res.json();
}

// The caller's own signature image — fetched only where it's actually shown
// (the Profile page), not on every session lookup.
export async function getMySignature(): Promise<string | null> {
  const res = await fetch("/api/auth/me/signature");
  if (!res.ok) return null;
  const data = (await res.json()) as { signatureImage: string | null } | null;
  return data?.signatureImage ?? null;
}

export async function updateProfile(data: {
  firstName: string;
  lastName: string;
  email: string;
  signatureImage?: string | null;
}): Promise<UserSummary> {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? "Failed to update profile");
  }
  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? "Failed to update password");
  }
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
