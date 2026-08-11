import type { UserSummary, UserRole } from "@/types";
import { mockUsers, getMockUserByEmail } from "@/features/authentication/mock/users";

export interface AuthResponse {
  user: UserSummary;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const user = getMockUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Account is inactive. Please contact administrator.");
  }

  if (password !== "password123") {
    throw new Error("Invalid email or password");
  }

  const token = `mock-jwt-token-${user.id}-${Date.now()}`;

  return { user, token };
}

export async function logout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
}

export async function getCurrentUser(token: string): Promise<UserSummary | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!token || !token.startsWith("mock-jwt-token-")) {
    return null;
  }

  const parts = token.split("-");
  const userId = parts.length >= 5 ? `${parts[3]}-${parts[4]}` : "";
  const user = mockUsers.find((u) => u.id === userId);

  return user || null;
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