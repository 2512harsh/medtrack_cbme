export interface StudentReportData {
  summary: {
    totalStudents: number;
    completedAssessments: number;
    pendingAssessments: number;
    remediationCases: number;
  };
  students: {
    id: string;
    name: string;
    rollNumber: string;
    batch: string;
    completed: number;
    pending: number;
    remediation: number;
    overallProgress: number;
  }[];
}

export interface FacultyReportData {
  summary: {
    totalFaculty: number;
    completedReviews: number;
    pendingReviews: number;
  };
  faculty: {
    id: string;
    name: string;
    designation: string;
    department: string;
    assessments: number;
    completed: number;
    pending: number;
    percentExceeds: number;
  }[];
}
