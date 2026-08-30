import type { Faculty, Student, StudentAllocation, CompetencyAssignment, Department, Assessment, Batch } from "@/types";
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
  data: Pick<HodAccount, "firstName" | "lastName" | "email" | "departmentId" | "status" | "password">
): Promise<HodAccount> {
  return apiSend<HodAccount>("/api/dean/hod", "POST", data);
}

export function updateHodAccount(id: string, data: Partial<HodAccount>): Promise<HodAccount> {
  return apiSend<HodAccount>(`/api/dean/hod/${id}`, "PATCH", data);
}

export function deactivateHodAccount(id: string): Promise<HodAccount> {
  return updateHodAccount(id, { status: "INACTIVE" });
}

export function getBatches(streamId?: string): Promise<Batch[]> {
  const url = streamId ? `/api/batches?streamId=${encodeURIComponent(streamId)}` : "/api/batches";
  return apiGet<Batch[]>(url);
}

export function createBatch(data: Pick<Batch, "name" | "streamId" | "admissionYear">): Promise<Batch> {
  return apiSend<Batch>("/api/batches", "POST", data);
}

export function getFaculty(departmentId?: string): Promise<Faculty[]> {
  const url = departmentId
    ? `/api/dean/faculty?departmentId=${encodeURIComponent(departmentId)}`
    : "/api/dean/faculty";
  return apiGet<Faculty[]>(url);
}

export function getStudents(): Promise<Student[]> {
  // Students are institution-scoped (Dean and HOD both see all of them) — the
  // server ignores any department filter, so there's no param here.
  return apiGet<Student[]>("/api/dean/students");
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
    batchId: data.batchId,
    admissionYear: data.admissionYear,
    firstName: data.user?.firstName,
    lastName: data.user?.lastName,
    email: data.user?.email,
    password,
    status: data.user?.status,
  };
}

export function createStudent(data: Omit<Student, "id" | "batch">, password: string): Promise<Student> {
  return apiSend<Student>("/api/dean/students", "POST", flattenStudent(data, password));
}

export interface StudentImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; sheet: string; message: string }[];
  credentials: { email: string; password: string }[];
}

export interface StudentImportRow {
  firstName: string;
  lastName?: string;
  email: string;
  rollNumber: string;
  registrationNumber: string;
  stream: string;
  professionalYear: string;
  batch: string;
  admissionYear?: string;
  password?: string;
  sheet?: string;
  rowNumber?: number;
}

export function importStudents(
  mode: "insert" | "update" | "upsert",
  rows: StudentImportRow[]
): Promise<StudentImportResult> {
  return apiSend<StudentImportResult>("/api/dean/students/import", "POST", { mode, rows });
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

export function assignCompetency(
  data: Omit<CompetencyAssignment, "id" | "assignedBy" | "assignedDate" | "batch">
): Promise<CompetencyAssignment> {
  return apiSend<CompetencyAssignment>("/api/dean/competency-assignments", "POST", data);
}

export function updateCompetencyAssignment(
  id: string,
  data: Partial<Pick<CompetencyAssignment, "facultyId" | "competencyId" | "batchId">>
): Promise<CompetencyAssignment> {
  return apiSend<CompetencyAssignment>(`/api/dean/competency-assignments/${id}`, "PATCH", data);
}

export function getAssessments(): Promise<Assessment[]> {
  return apiGet<Assessment[]>("/api/assessments");
}

function assessmentCountsByAssignment(assessmentsList: Assessment[]): Map<string, { completed: number; total: number }> {
  const counts = new Map<string, { completed: number; total: number }>();
  for (const a of assessmentsList) {
    const entry = counts.get(a.competencyAssignmentId) ?? { completed: 0, total: 0 };
    entry.total += 1;
    if (a.currentStatus === "Completed") entry.completed += 1;
    counts.set(a.competencyAssignmentId, entry);
  }
  return counts;
}

export async function getDepartmentProgress(departmentId?: string): Promise<{ subject: string; completed: number; total: number }[]> {
  const [assignments, assessmentsList] = await Promise.all([
    getCompetencyAssignments(departmentId),
    getAssessments(),
  ]);
  const counts = assessmentCountsByAssignment(assessmentsList);

  const totalsBySubject = new Map<string, { completed: number; total: number }>();
  for (const assignment of assignments) {
    const subjectName = assignment.competency?.subjectName ?? "Unassigned";
    const assignmentCounts = counts.get(assignment.id) ?? { completed: 0, total: 0 };
    const entry = totalsBySubject.get(subjectName) ?? { completed: 0, total: 0 };
    entry.completed += assignmentCounts.completed;
    entry.total += assignmentCounts.total;
    totalsBySubject.set(subjectName, entry);
  }

  return Array.from(totalsBySubject.entries()).map(([subject, totals]) => ({ subject, ...totals }));
}

export async function getDepartmentWiseProgress(): Promise<{ department: string; completed: number; total: number }[]> {
  const [departments, assignments, assessmentsList] = await Promise.all([
    getDepartments(),
    getCompetencyAssignments(),
    getAssessments(),
  ]);
  const counts = assessmentCountsByAssignment(assessmentsList);

  const totalsByDepartmentId = new Map<string, { completed: number; total: number }>();
  for (const assignment of assignments) {
    const departmentId = assignment.faculty?.departmentId;
    if (!departmentId) continue;
    const assignmentCounts = counts.get(assignment.id) ?? { completed: 0, total: 0 };
    const entry = totalsByDepartmentId.get(departmentId) ?? { completed: 0, total: 0 };
    entry.completed += assignmentCounts.completed;
    entry.total += assignmentCounts.total;
    totalsByDepartmentId.set(departmentId, entry);
  }

  return departments.map((d) => ({ department: d.name, ...(totalsByDepartmentId.get(d.id) ?? { completed: 0, total: 0 }) }));
}

export interface DepartmentReportRow {
  id: string;
  name: string;
  faculty: number;
  students: number;
  completed: number;
  total: number;
  progress: number;
}

// Faculty/assignments/assessments below are already scoped server-side to the
// caller (Dean/HOD -> own institution), so the department breakdown comes out
// right per role with no extra filtering here. Students are not tied to a
// department — a student rotates through many over their years — so a
// department's "students" is the count of distinct students who have an
// assessment under that department's competency assignments.
export async function getDepartmentReport(): Promise<{
  summary: { totalDepartments: number; totalFaculty: number; totalStudents: number };
  departments: DepartmentReportRow[];
}> {
  const [allDepartments, facultyList, studentList, assignments, assessmentsList] = await Promise.all([
    getDepartments(),
    getFaculty(),
    getStudents(),
    getCompetencyAssignments(),
    getAssessments(),
  ]);
  const counts = assessmentCountsByAssignment(assessmentsList);

  const relevantDepartmentIds = new Set<string>();
  facultyList.forEach((f) => f.departmentId && relevantDepartmentIds.add(f.departmentId));

  const rows: DepartmentReportRow[] = allDepartments
    .filter((d) => relevantDepartmentIds.has(d.id))
    .map((d) => {
      const deptFaculty = facultyList.filter((f) => f.departmentId === d.id).length;
      const deptAssignments = assignments.filter((a) => a.faculty?.departmentId === d.id);
      const deptAssignmentIds = new Set(deptAssignments.map((a) => a.id));
      const deptStudents = new Set(
        assessmentsList.filter((a) => deptAssignmentIds.has(a.competencyAssignmentId)).map((a) => a.studentId)
      ).size;

      let completed = 0;
      let total = 0;
      for (const a of deptAssignments) {
        const c = counts.get(a.id) ?? { completed: 0, total: 0 };
        completed += c.completed;
        total += c.total;
      }

      return {
        id: d.id,
        name: d.name,
        faculty: deptFaculty,
        students: deptStudents,
        completed,
        total,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

  return {
    summary: {
      totalDepartments: rows.length,
      totalFaculty: rows.reduce((sum, r) => sum + r.faculty, 0),
      // Institution-wide distinct student count — students aren't partitioned
      // by department, so summing the per-department counts would double-count.
      totalStudents: studentList.length,
    },
    departments: rows,
  };
}