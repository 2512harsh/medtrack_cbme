import type { Institution, Department, UserSummary } from "@/types";
import {
  mockHodAccounts,
  mockPlatformMetrics,
  mockRecentActivity,
  DeanAccount,
  HodAccount,
} from "../mock/superAdmin";
import { getHodAccounts as getRealHodAccounts } from "@/features/dean/services/dean";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return res.json();
}

async function apiSend<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? `Failed to save (${url})`);
  }
  return res.json();
}

export function getInstitutions(): Promise<Institution[]> {
  return apiGet<Institution[]>("/api/institutions");
}

export async function getInstitutionById(id: string): Promise<Institution | undefined> {
  const institutions = await getInstitutions();
  return institutions.find((i) => i.id === id);
}

export function createInstitution(
  data: Omit<Institution, "id" | "createdAt" | "updatedAt">
): Promise<Institution> {
  return apiSend<Institution>("/api/institutions", "POST", data);
}

export function updateInstitution(id: string, data: Partial<Institution>): Promise<Institution> {
  return apiSend<Institution>(`/api/institutions/${id}`, "PATCH", data);
}

export function setInstitutionStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<Institution> {
  return updateInstitution(id, { status });
}

export function getDepartments(): Promise<Department[]> {
  return apiGet<Department[]>("/api/curriculum/departments");
}

export async function getDepartmentById(id: string): Promise<Department | undefined> {
  const res = await fetch(`/api/curriculum/departments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load department ${id}`);
  return res.json();
}

export function createDepartment(
  data: Omit<Department, "id" | "createdAt" | "updatedAt">
): Promise<Department> {
  return apiSend<Department>("/api/curriculum/departments", "POST", data);
}

export function updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  return apiSend<Department>(`/api/curriculum/departments/${id}`, "PATCH", data);
}

export function setDepartmentStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<Department> {
  return updateDepartment(id, { status });
}

export function getDeanAccounts(institutionId?: string): Promise<DeanAccount[]> {
  const url = institutionId
    ? `/api/super-admin/deans?institutionId=${encodeURIComponent(institutionId)}`
    : "/api/super-admin/deans";
  return apiGet<DeanAccount[]>(url);
}

export function createDeanAccount(
  data: Pick<DeanAccount, "firstName" | "lastName" | "email" | "institutionId" | "status" | "password">
): Promise<DeanAccount> {
  return apiSend<DeanAccount>("/api/super-admin/deans", "POST", data);
}

export function updateDeanAccount(id: string, data: Partial<DeanAccount>): Promise<DeanAccount> {
  return apiSend<DeanAccount>(`/api/super-admin/deans/${id}`, "PATCH", data);
}

export function deactivateDeanAccount(id: string): Promise<DeanAccount> {
  return updateDeanAccount(id, { status: "INACTIVE" });
}

export function getHodAccounts(): Promise<HodAccount[]> {
  return Promise.resolve(mockHodAccounts);
}

export function createHodAccount(
  data: Pick<UserSummary, "firstName" | "lastName" | "email" | "departmentId"> & {
    password: string;
  }
): Promise<HodAccount> {
  const now = new Date().toISOString();
  const account: HodAccount = {
    ...data,
    id: `user-hod-${Date.now()}`,
    role: "HOD",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
  mockHodAccounts.push(account);
  return Promise.resolve(account);
}

export async function getDashboardStats(): Promise<{
  totalInstitutions: number;
  totalDepartments: number;
  activeDeans: number;
  activeHods: number;
  platformHealth: string;
  institutions: Institution[];
  recentActivity: typeof mockRecentActivity;
}> {
  const [institutions, departments, deans, hods] = await Promise.all([
    getInstitutions(),
    getDepartments(),
    getDeanAccounts(),
    getRealHodAccounts(),
  ]);
  return {
    totalInstitutions: institutions.length,
    totalDepartments: departments.length,
    activeDeans: deans.filter((a) => a.status === "ACTIVE").length,
    activeHods: hods.filter((a) => a.status === "ACTIVE").length,
    platformHealth: mockPlatformMetrics.uptime,
    institutions,
    recentActivity: mockRecentActivity,
  };
}

export type { DeanAccount, HodAccount };
