import type { Institution, Department, UserSummary } from "@/types";
import {
  mockInstitutions,
  mockDepartments,
  mockHodAccounts,
  mockPlatformMetrics,
  mockRecentActivity,
  mockSystemSettings,
  mockCompetencyImportRecords,
  HodAccount,
} from "../mock/superAdmin";

export function getInstitutions(): Promise<Institution[]> {
  return Promise.resolve(mockInstitutions);
}

export function getInstitutionById(id: string): Promise<Institution | undefined> {
  return Promise.resolve(mockInstitutions.find((i) => i.id === id));
}

export function getDepartmentsByInstitutionId(institutionId: string): Promise<Department[]> {
  return Promise.resolve(mockDepartments.filter((d) => d.institutionId === institutionId));
}

export function createInstitution(
  data: Omit<Institution, "id" | "createdAt" | "updatedAt">
): Promise<Institution> {
  const now = new Date().toISOString();
  const institution: Institution = {
    ...data,
    id: `inst-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  mockInstitutions.unshift(institution);
  return Promise.resolve(institution);
}

export function updateInstitution(id: string, data: Partial<Institution>): Promise<Institution> {
  const index = mockInstitutions.findIndex((i) => i.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Institution not found"));
  }
  mockInstitutions[index] = {
    ...mockInstitutions[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(mockInstitutions[index]);
}

export function setInstitutionStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<Institution> {
  return updateInstitution(id, { status });
}

export function getDepartments(): Promise<Department[]> {
  return Promise.resolve(mockDepartments);
}

export function getDepartmentById(id: string): Promise<Department | undefined> {
  return Promise.resolve(mockDepartments.find((d) => d.id === id));
}

export function getDepartmentsByInstitution(institutionId: string): Promise<Department[]> {
  return Promise.resolve(mockDepartments.filter((d) => d.institutionId === institutionId));
}

export function createDepartment(
  data: Omit<Department, "id" | "createdAt" | "updatedAt">
): Promise<Department> {
  const now = new Date().toISOString();
  const department: Department = {
    ...data,
    id: `dept-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  mockDepartments.push(department);
  return Promise.resolve(department);
}

export function updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  const index = mockDepartments.findIndex((d) => d.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Department not found"));
  }
  mockDepartments[index] = {
    ...mockDepartments[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(mockDepartments[index]);
}

export function setDepartmentStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<Department> {
  return updateDepartment(id, { status });
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

export function setHodAccountStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<HodAccount> {
  const index = mockHodAccounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return Promise.reject(new Error("HOD account not found"));
  }
  mockHodAccounts[index] = {
    ...mockHodAccounts[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(mockHodAccounts[index]);
}

export function getDashboardStats(): Promise<{
  totalInstitutions: number;
  totalDepartments: number;
  activeHods: number;
  platformHealth: string;
  institutions: Institution[];
  recentActivity: typeof mockRecentActivity;
}> {
  return Promise.resolve({
    totalInstitutions: mockInstitutions.length,
    totalDepartments: mockDepartments.length,
    activeHods: mockHodAccounts.filter((a) => a.status === "ACTIVE").length,
    platformHealth: mockPlatformMetrics.uptime,
    institutions: mockInstitutions,
    recentActivity: mockRecentActivity,
  });
}

export function getPlatformMetrics(): Promise<typeof mockPlatformMetrics> {
  return Promise.resolve(mockPlatformMetrics);
}

export function getRecentActivity(): Promise<typeof mockRecentActivity> {
  return Promise.resolve(mockRecentActivity);
}

export function getSystemSettings(): Promise<typeof mockSystemSettings> {
  return Promise.resolve(mockSystemSettings);
}

export function updateSystemSettings(
  data: Partial<typeof mockSystemSettings>
): Promise<typeof mockSystemSettings> {
  Object.assign(mockSystemSettings, data);
  return Promise.resolve(mockSystemSettings);
}

export function getCompetencyImportRecords(): Promise<typeof mockCompetencyImportRecords> {
  return Promise.resolve(mockCompetencyImportRecords);
}

export function createCompetencyImport(data: {
  fileName: string;
  importedBy: string;
}): Promise<typeof mockCompetencyImportRecords[number]> {
  const now = new Date().toISOString();
  const record = {
    id: `imp-${Date.now()}`,
    fileName: data.fileName,
    source: "Institution Custom",
    type: "Professional Year",
    totalRecords: 0,
    imported: 0,
    duplicates: 0,
    failed: 0,
    importedBy: data.importedBy,
    importedAt: now,
  };
  mockCompetencyImportRecords.unshift(record);
  return Promise.resolve(record);
}

export type { HodAccount };