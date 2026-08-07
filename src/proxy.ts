import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types";
import { mockUsers } from "@/features/authentication/mock/users";

// Shared, any-authenticated-role sections (role-scoping is applied in the UI).
const SHARED_PREFIXES = [
  "/dashboard",
  "/assessment",
  "/reports",
  "/settings",
  "/curriculum",
  "/integrations",
  "/billing",
];

// Role-scoped path prefixes. A path matching one of these is only reachable by its roles.
const ROLE_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/super-admin", roles: ["Super Admin"] },
  { prefix: "/dashboard/super-admin", roles: ["Super Admin"] },
  { prefix: "/hod", roles: ["HOD"] },
  { prefix: "/dashboard/hod", roles: ["HOD"] },
  { prefix: "/faculty", roles: ["Faculty"] },
  { prefix: "/dashboard/faculty", roles: ["Faculty"] },
  { prefix: "/student", roles: ["Student"] },
  { prefix: "/dashboard/student", roles: ["Student"] },
];

const DASHBOARD_ROUTE: Record<UserRole, string> = {
  "Super Admin": "/dashboard/super-admin",
  HOD: "/dashboard/hod",
  Faculty: "/dashboard/faculty",
  Student: "/dashboard/student",
};

function decodeRole(token: string | undefined): UserRole | null {
  if (!token || !token.startsWith("mock-jwt-token-")) {
    return null;
  }
  const parts = token.split("-");
  const userId = parts.length >= 5 ? `${parts[3]}-${parts[4]}` : "";
  const user = mockUsers.find((u) => u.id === userId);
  return user?.role ?? null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = decodeRole(request.cookies.get("medtrack_token")?.value);

  const loginUrl = new URL("/login", request.url);
  const dashboardUrl = new URL(role ? DASHBOARD_ROUTE[role] : "/login", request.url);
  const unauthorizedUrl = new URL("/unauthorized", request.url);

  // Already-authenticated users visiting an auth page are sent to their dashboard.
  if (pathname === "/login" || pathname === "/forgot-password") {
    if (role) {
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Landing page resolves to login or the role dashboard.
  if (pathname === "/") {
    return NextResponse.redirect(dashboardUrl);
  }

  // Error-status page is always reachable.
  if (pathname === "/unauthorized") {
    return NextResponse.next();
  }

  // Protected route with no session -> login.
  if (!role) {
    return NextResponse.redirect(loginUrl);
  }

  // Role-scoped routes.
  for (const { prefix, roles } of ROLE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      if (roles.includes(role)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Shared routes (any authenticated role). Unknown paths fall through to the router.
  if (SHARED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|fonts|images).*)",
};