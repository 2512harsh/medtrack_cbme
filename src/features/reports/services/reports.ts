import {
  mockDepartmentReportData,
  mockCompetencyCompletionData,
  mockRemediationReportData,
  mockAuditReportData,
} from "@/features/reports/mock/reports";
import type { StudentReportData, FacultyReportData } from "@/features/reports/types";

export async function getStudentReportData(): Promise<StudentReportData> {
  const res = await fetch("/api/reports/student");
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Failed to load student report");
  return res.json();
}

export async function getFacultyReportData(): Promise<FacultyReportData> {
  const res = await fetch("/api/reports/faculty");
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Failed to load faculty report");
  return res.json();
}

export function getDepartmentReportData() {
  return Promise.resolve(mockDepartmentReportData);
}

export function getCompetencyCompletionData() {
  return Promise.resolve(mockCompetencyCompletionData);
}

export function getRemediationReportData() {
  return Promise.resolve(mockRemediationReportData);
}

export function getAuditReportData() {
  return Promise.resolve(mockAuditReportData);
}
