import type { Faculty, Student, StudentAllocation, CompetencyAssignment, Department } from "@/types";
import { mockSubjects } from "@/features/curriculum/mock/curriculum";
import { mockDepartments as legacyMockDepartments } from "@/features/super-admin/mock/superAdmin";
import type { HodAccount } from "@/features/super-admin/mock/superAdmin";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return res.json();
}

async function apiSend<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? `Failed to save (${url})`);
  }
  return res.json();
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

export function getHodAccounts(filters?: { institutionId?: string; departmentId?: string }): Promise<HodAccount[]> {
  const params = new URLSearchParams();
  if (filters?.institutionId) params.set("institutionId", filters.institutionId);
  if (filters?.departmentId) params.set("departmentId", filters.departmentId);
  const query = params.toString();
  return apiGet<HodAccount[]>(query ? `/api/dean/hod?${query}` : "/api/dean/hod");
}

export function createHodAccount(
  data: Pick<HodAccount, "firstName" | "lastName" | "email" | "institutionId" | "departmentId" | "status" | "password">
): Promise<HodAccount> {
  return apiSend<HodAccount>("/api/dean/hod", "POST", data);
}

export function updateHodAccount(id: string, data: Partial<HodAccount>): Promise<HodAccount> {
  return apiSend<HodAccount>(`/api/dean/hod/${id}`, "PATCH", data);
}

export function deactivateHodAccount(id: string): Promise<HodAccount> {
  return updateHodAccount(id, { status: "INACTIVE" });
}

export function getFaculty(departmentId?: string): Promise<Faculty[]> {
  const url = departmentId
    ? `/api/dean/faculty?departmentId=${encodeURIComponent(departmentId)}`
    : "/api/dean/faculty";
  return apiGet<Faculty[]>(url);
}

export function getStudents(departmentId?: string): Promise<Student[]> {
  const url = departmentId
    ? `/api/dean/students?departmentId=${encodeURIComponent(departmentId)}`
    : "/api/dean/students";
  return apiGet<Student[]>(url);
}

export function getStudentAllocations(departmentId?: string): Promise<StudentAllocation[]> {
  const url = departmentId
    ? `/api/dean/student-allocations?departmentId=${encodeURIComponent(departmentId)}`
    : "/api/dean/student-allocations";
  return apiGet<StudentAllocation[]>(url);
}

export function getCompetencyAssignments(departmentId?: string): Promise<CompetencyAssignment[]> {
  const url = departmentId
    ? `/api/dean/competency-assignments?departmentId=${encodeURIComponent(departmentId)}`
    : "/api/dean/competency-assignments";
  return apiGet<CompetencyAssignment[]>(url);
}

export async function getFacultyById(id: string): Promise<Faculty | undefined> {
  const res = await fetch(`/api/dean/faculty/${id}`);
  if (res.status === 404) {
    return undefined;
  }
  if (!res.ok) {
    throw new Error(`Failed to load faculty ${id}`);
  }
  return res.json();
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const res = await fetch(`/api/dean/students/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load student ${id}`);
  return res.json();
}

export async function getStudentAllocationById(id: string): Promise<StudentAllocation | undefined> {
  const res = await fetch(`/api/dean/student-allocations/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load allocation ${id}`);
  return res.json();
}

export function getAllocationHistory(departmentId?: string): Promise<StudentAllocation[]> {
  return getStudentAllocations(departmentId);
}

export async function getCompetencyAssignmentById(id: string): Promise<CompetencyAssignment | undefined> {
  const res = await fetch(`/api/dean/competency-assignments/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to load competency assignment ${id}`);
  return res.json();
}

export interface FacultyWriteData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
  designation: string;
  employeeCode: string;
  specialization?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export function createFaculty(data: FacultyWriteData): Promise<Faculty> {
  return apiSend<Faculty>("/api/dean/faculty", "POST", data);
}

export function updateFaculty(id: string, data: Partial<FacultyWriteData>): Promise<Faculty> {
  return apiSend<Faculty>(`/api/dean/faculty/${id}`, "PATCH", data);
}

export function deactivateFaculty(id: string): Promise<Faculty> {
  return apiSend<Faculty>(`/api/dean/faculty/${id}`, "PATCH", { status: "INACTIVE" });
}

function flattenStudent(data: Partial<Student>, password?: string) {
  return {
    rollNumber: data.rollNumber,
    registrationNumber: data.registrationNumber,
    streamId: data.streamId,
    professionalYearId: data.professionalYearId,
    batch: data.batch,
    admissionYear: data.admissionYear,
    firstName: data.user?.firstName,
    lastName: data.user?.lastName,
    email: data.user?.email,
    password,
    departmentId: data.user?.departmentId,
    status: data.user?.status,
  };
}

export function createStudent(data: Omit<Student, "id">, password: string): Promise<Student> {
  return apiSend<Student>("/api/dean/students", "POST", flattenStudent(data, password));
}

export function updateStudent(id: string, data: Partial<Student>, password?: string): Promise<Student> {
  return apiSend<Student>(`/api/dean/students/${id}`, "PATCH", flattenStudent(data, password));
}

export async function deleteStudent(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/api/dean/students/${id}`, "DELETE");
}

export function allocateStudent(data: Omit<StudentAllocation, "id" | "allocatedBy" | "allocatedDate">): Promise<StudentAllocation> {
  return apiSend<StudentAllocation>("/api/dean/student-allocations", "POST", data);
}

export function reassignStudentAllocation(id: string, newFacultyId: string): Promise<StudentAllocation> {
  return apiSend<StudentAllocation>(`/api/dean/student-allocations/${id}`, "PATCH", { facultyId: newFacultyId });
}

export function assignCompetency(data: Omit<CompetencyAssignment, "id" | "assignedBy" | "assignedDate">): Promise<CompetencyAssignment> {
  return apiSend<CompetencyAssignment>("/api/dean/competency-assignments", "POST", data);
}

const subjectProgressBaseline: Record<string, { completed: number; total: number }> = {
  "sub-1": { completed: 45, total: 60 },
  "sub-2": { completed: 38, total: 55 },
  "sub-3": { completed: 42, total: 58 },
};

export function getDepartmentProgress(departmentId?: string): Promise<{ subject: string; completed: number; total: number }[]> {
  const subjects = departmentId
    ? mockSubjects.filter((s) => s.departmentId === departmentId)
    : mockSubjects;

  return Promise.resolve(
    subjects.map((s) => ({
      subject: s.name,
      ...(subjectProgressBaseline[s.id] ?? { completed: 0, total: 0 }),
    }))
  );
}

export function getDepartmentWiseProgress(): Promise<{ department: string; completed: number; total: number }[]> {
  return Promise.resolve(
    legacyMockDepartments.map((d) => {
      const subjects = mockSubjects.filter((s) => s.departmentId === d.id);
      const totals = subjects.reduce(
        (acc, s) => {
          const baseline = subjectProgressBaseline[s.id] ?? { completed: 0, total: 0 };
          acc.completed += baseline.completed;
          acc.total += baseline.total;
          return acc;
        },
        { completed: 0, total: 0 }
      );
      return { department: d.name, ...totals };
    })
  );
}