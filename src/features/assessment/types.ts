export interface RemediationWorkflowCase {
  id: string;
  studentName: string;
  competencyCode: string;
  competencyTitle: string;
  facultyName: string;
  originalDecision: string;
  originalAttempt: number;
  remediationDate: string;
  status: "Scheduled" | "In Progress" | "Pending" | "Completed";
}
