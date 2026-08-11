import type { UserSummary, UserRole } from "@/types";

export const mockUsers: UserSummary[] = [
  {
    id: "user-1",
    firstName: "Dr. Anand",
    lastName: "Sharma",
    email: "superadmin@medtrack.edu",
    role: "Super Admin",
    status: "ACTIVE",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "user-2",
    firstName: "Prof. Meera",
    lastName: "Reddy",
    email: "dean.anatomy@medtrack.edu",
    role: "Dean",
    status: "ACTIVE",
    departmentId: "dept-1",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "user-5",
    firstName: "Dr. Ashok",
    lastName: "Verma",
    email: "hod.anatomy@medtrack.edu",
    role: "HOD",
    status: "ACTIVE",
    departmentId: "dept-1",
    createdAt: "2024-01-22T10:00:00Z",
    updatedAt: "2024-01-22T10:00:00Z",
  },
  {
    id: "user-3",
    firstName: "Dr. Rajesh",
    lastName: "Kumar",
    email: "faculty.physiology@medtrack.edu",
    role: "Faculty",
    status: "ACTIVE",
    departmentId: "dept-2",
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "user-4",
    firstName: "Aarav",
    lastName: "Patel",
    email: "student2024001@medtrack.edu",
    role: "Student",
    status: "ACTIVE",
    departmentId: "dept-1",
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-08-01T10:00:00Z",
  },
];

export function getMockUserByEmail(email: string): UserSummary | undefined {
  return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getMockUserByRole(role: UserRole): UserSummary | undefined {
  return mockUsers.find((u) => u.role === role);
}