import {
  mockStudentReportData,
  mockFacultyReportData,
  mockDepartmentReportData,
  mockCompetencyCompletionData,
  mockRemediationReportData,
  mockAuditReportData,
} from "@/features/reports/mock/reports";

export function getStudentReportData() {
  return Promise.resolve(mockStudentReportData);
}

export function getFacultyReportData() {
  return Promise.resolve(mockFacultyReportData);
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
