import type { Faculty, Student, StudentAllocation, CompetencyAssignment, Department } from "@/types";
import {
  mockFaculty,
  mockStudents,
  mockStudentAllocations,
  mockCompetencyAssignments,
  mockDepartment,
} from "@/features/hod/mock/hod";

export function getDepartments(): Promise<Department[]> {
  return Promise.resolve([mockDepartment]);
}

export function getFaculty(): Promise<Faculty[]> {
  return Promise.resolve(mockFaculty);
}

export function getStudents(): Promise<Student[]> {
  return Promise.resolve(mockStudents);
}

export function getStudentAllocations(): Promise<StudentAllocation[]> {
  return Promise.resolve(mockStudentAllocations);
}

export function getCompetencyAssignments(): Promise<CompetencyAssignment[]> {
  return Promise.resolve(mockCompetencyAssignments);
}

export function getFacultyById(id: string): Promise<Faculty | undefined> {
  return Promise.resolve(mockFaculty.find((f) => f.id === id));
}

export function getStudentById(id: string): Promise<Student | undefined> {
  return Promise.resolve(mockStudents.find((s) => s.id === id));
}

export function getStudentAllocationById(id: string): Promise<StudentAllocation | undefined> {
  return Promise.resolve(mockStudentAllocations.find((a) => a.id === id));
}

export function getAllocationHistory(): Promise<StudentAllocation[]> {
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
  ];
  return Promise.resolve(history);
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
  const newAllocation: StudentAllocation = {
    ...data,
    id: `alloc-${Date.now()}`,
    allocatedBy: "user-hod-1",
    allocatedDate: new Date().toISOString(),
  };
  mockStudentAllocations.push(newAllocation);
  return Promise.resolve(newAllocation);
}

export function reassignStudentAllocation(id: string, newFacultyId: string): Promise<StudentAllocation> {
  const index = mockStudentAllocations.findIndex((a) => a.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Allocation not found"));
  }
  mockStudentAllocations[index] = {
    ...mockStudentAllocations[index],
    facultyId: newFacultyId,
  };
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

export function getDepartmentProgress(): Promise<{ subject: string; completed: number; total: number }[]> {
  return Promise.resolve([
    { subject: "Anatomy", completed: 45, total: 60 },
    { subject: "Physiology", completed: 38, total: 55 },
    { subject: "Biochemistry", completed: 42, total: 58 },
  ]);
}