import type { Faculty, Student, StudentAllocation, CompetencyAssignment, Department } from "@/types";
import {
  mockFaculty,
  mockStudents,
  mockStudentAllocations,
  mockCompetencyAssignments,
} from "@/features/dean/mock/dean";
import { mockDepartments, mockHodAccounts, type HodAccount } from "@/features/super-admin/mock/superAdmin";
import { mockSubjects } from "@/features/curriculum/mock/curriculum";

export function getDepartments(): Promise<Department[]> {
  return Promise.resolve(mockDepartments);
}

export function getDepartmentById(id: string): Promise<Department | undefined> {
  return Promise.resolve(mockDepartments.find((d) => d.id === id));
}

export function getHodAccounts(institutionId?: string): Promise<HodAccount[]> {
  if (!institutionId) {
    return Promise.resolve(mockHodAccounts);
  }
  const deptIds = new Set(
    mockDepartments.filter((d) => d.institutionId === institutionId).map((d) => d.id)
  );
  return Promise.resolve(mockHodAccounts.filter((h) => h.departmentId && deptIds.has(h.departmentId)));
}

export function createHodAccount(
  data: Pick<HodAccount, "firstName" | "lastName" | "email" | "departmentId" | "status">
): Promise<HodAccount> {
  const now = new Date().toISOString();
  const account: HodAccount = {
    ...data,
    id: `user-hod-${Date.now()}`,
    role: "HOD",
    createdAt: now,
    updatedAt: now,
  };
  mockHodAccounts.push(account);
  const dept = mockDepartments.find((d) => d.id === account.departmentId);
  if (dept) {
    dept.hodId = account.id;
  }
  return Promise.resolve(account);
}

export function updateHodAccount(id: string, data: Partial<HodAccount>): Promise<HodAccount> {
  const index = mockHodAccounts.findIndex((h) => h.id === id);
  if (index === -1) {
    return Promise.reject(new Error("HOD not found"));
  }
  const previousDepartmentId = mockHodAccounts[index].departmentId;
  mockHodAccounts[index] = { ...mockHodAccounts[index], ...data, updatedAt: new Date().toISOString() };
  const newDepartmentId = mockHodAccounts[index].departmentId;

  if (previousDepartmentId !== newDepartmentId) {
    if (previousDepartmentId) {
      const prevDept = mockDepartments.find((d) => d.id === previousDepartmentId);
      if (prevDept && prevDept.hodId === id) {
        prevDept.hodId = undefined;
      }
    }
    if (newDepartmentId) {
      const newDept = mockDepartments.find((d) => d.id === newDepartmentId);
      if (newDept) {
        newDept.hodId = id;
      }
    }
  }

  return Promise.resolve(mockHodAccounts[index]);
}

export function deactivateHodAccount(id: string): Promise<HodAccount> {
  return updateHodAccount(id, { status: "INACTIVE" });
}

export function getFaculty(departmentId?: string): Promise<Faculty[]> {
  if (!departmentId) {
    return Promise.resolve(mockFaculty);
  }
  return Promise.resolve(mockFaculty.filter((f) => f.departmentId === departmentId));
}

export function getStudents(departmentId?: string): Promise<Student[]> {
  if (!departmentId) {
    return Promise.resolve(mockStudents);
  }
  return Promise.resolve(mockStudents.filter((s) => s.user?.departmentId === departmentId));
}

function hydrateAllocation(a: StudentAllocation): StudentAllocation {
  return {
    ...a,
    faculty: a.faculty ?? mockFaculty.find((f) => f.id === a.facultyId),
    student: a.student ?? mockStudents.find((s) => s.id === a.studentId),
    subject: a.subject ?? mockSubjects.find((s) => s.id === a.subjectId),
  };
}

export function getStudentAllocations(departmentId?: string): Promise<StudentAllocation[]> {
  if (!departmentId) {
    return Promise.resolve(mockStudentAllocations.map(hydrateAllocation));
  }
  const deptFacultyIds = new Set(
    mockFaculty.filter((f) => f.departmentId === departmentId).map((f) => f.id)
  );
  return Promise.resolve(
    mockStudentAllocations.filter((a) => deptFacultyIds.has(a.facultyId)).map(hydrateAllocation)
  );
}

export function getCompetencyAssignments(departmentId?: string): Promise<CompetencyAssignment[]> {
  if (!departmentId) {
    return Promise.resolve(mockCompetencyAssignments);
  }
  const deptFacultyIds = new Set(
    mockFaculty.filter((f) => f.departmentId === departmentId).map((f) => f.id)
  );
  return Promise.resolve(mockCompetencyAssignments.filter((a) => deptFacultyIds.has(a.facultyId)));
}

export function getFacultyById(id: string): Promise<Faculty | undefined> {
  return Promise.resolve(mockFaculty.find((f) => f.id === id));
}

export function getStudentById(id: string): Promise<Student | undefined> {
  return Promise.resolve(mockStudents.find((s) => s.id === id));
}

export function getStudentAllocationById(id: string): Promise<StudentAllocation | undefined> {
  const found = mockStudentAllocations.find((a) => a.id === id);
  return Promise.resolve(found ? hydrateAllocation(found) : undefined);
}

export function getAllocationHistory(departmentId?: string): Promise<StudentAllocation[]> {
  const history = [
    ...mockStudentAllocations,
    ...mockStudentAllocations.slice(0, 2).map((a, i) => ({
      ...a,
      id: `${a.id}-hist-${i + 1}`,
      facultyId: i === 0 ? "fac-2" : "fac-3",
      faculty: i === 0 ? mockFaculty[1] : mockFaculty[2],
      active: false,
      allocatedDate: "2024-05-15T00:00:00Z",
    })),
  ].map(hydrateAllocation);
  if (!departmentId) {
    return Promise.resolve(history);
  }
  const deptFacultyIds = new Set(
    mockFaculty.filter((f) => f.departmentId === departmentId).map((f) => f.id)
  );
  return Promise.resolve(history.filter((a) => deptFacultyIds.has(a.facultyId)));
}

export function getCompetencyAssignmentById(id: string): Promise<CompetencyAssignment | undefined> {
  return Promise.resolve(mockCompetencyAssignments.find((a) => a.id === id));
}

export function createFaculty(data: Omit<Faculty, "id">): Promise<Faculty> {
  const newFaculty: Faculty = {
    ...data,
    id: `fac-${Date.now()}`,
  };
  mockFaculty.push(newFaculty);
  return Promise.resolve(newFaculty);
}

export function updateFaculty(id: string, data: Partial<Faculty>): Promise<Faculty> {
  const index = mockFaculty.findIndex((f) => f.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Faculty not found"));
  }
  mockFaculty[index] = { ...mockFaculty[index], ...data };
  return Promise.resolve(mockFaculty[index]);
}

export function deactivateFaculty(id: string): Promise<Faculty> {
  const index = mockFaculty.findIndex((f) => f.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Faculty not found"));
  }
  mockFaculty[index] = {
    ...mockFaculty[index],
    user: mockFaculty[index].user
      ? { ...mockFaculty[index].user, status: "INACTIVE" }
      : undefined,
  };
  return Promise.resolve(mockFaculty[index]);
}

export function createStudent(data: Omit<Student, "id">): Promise<Student> {
  const newStudent: Student = {
    ...data,
    id: `stu-${Date.now()}`,
  };
  mockStudents.push(newStudent);
  return Promise.resolve(newStudent);
}

export function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const index = mockStudents.findIndex((s) => s.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Student not found"));
  }
  mockStudents[index] = { ...mockStudents[index], ...data };
  return Promise.resolve(mockStudents[index]);
}

export function deleteStudent(id: string): Promise<void> {
  const index = mockStudents.findIndex((s) => s.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Student not found"));
  }
  mockStudents.splice(index, 1);
  return Promise.resolve();
}

export function allocateStudent(data: Omit<StudentAllocation, "id" | "allocatedBy" | "allocatedDate">): Promise<StudentAllocation> {
  const newAllocation: StudentAllocation = hydrateAllocation({
    ...data,
    id: `alloc-${Date.now()}`,
    allocatedBy: "user-hod-1",
    allocatedDate: new Date().toISOString(),
  });
  mockStudentAllocations.push(newAllocation);
  return Promise.resolve(newAllocation);
}

export function reassignStudentAllocation(id: string, newFacultyId: string): Promise<StudentAllocation> {
  const index = mockStudentAllocations.findIndex((a) => a.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Allocation not found"));
  }
  mockStudentAllocations[index] = hydrateAllocation({
    ...mockStudentAllocations[index],
    facultyId: newFacultyId,
    faculty: mockFaculty.find((f) => f.id === newFacultyId),
  });
  return Promise.resolve(mockStudentAllocations[index]);
}

export function assignCompetency(data: Omit<CompetencyAssignment, "id" | "assignedBy" | "assignedDate">): Promise<CompetencyAssignment> {
  const newAssignment: CompetencyAssignment = {
    ...data,
    id: `ca-${Date.now()}`,
    assignedBy: "user-hod-1",
    assignedDate: new Date().toISOString(),
  };
  mockCompetencyAssignments.push(newAssignment);
  return Promise.resolve(newAssignment);
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

export function getDepartmentWiseProgress(institutionId?: string): Promise<{ department: string; completed: number; total: number }[]> {
  const departments = institutionId
    ? mockDepartments.filter((d) => d.institutionId === institutionId)
    : mockDepartments;

  return Promise.resolve(
    departments.map((d) => {
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