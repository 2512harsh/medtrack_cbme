export const mockDepartmentReportData = {
  summary: {
    totalDepartments: 3,
    totalFaculty: 8,
    totalStudents: 156,
    overallCompletion: 67,
  },
  departments: [
    { id: "dept-1", name: "Anatomy", faculty: 3, students: 52, completed: 45, total: 60, progress: 75 },
    { id: "dept-2", name: "Physiology", faculty: 3, students: 52, completed: 38, total: 55, progress: 69 },
    { id: "dept-3", name: "Biochemistry", faculty: 2, students: 52, completed: 42, total: 58, progress: 72 },
  ],
};

export const mockCompetencyCompletionData = {
  summary: {
    totalCompetencies: 25,
    completed: 18,
    inProgress: 4,
    notStarted: 3,
    completionRate: 72,
  },
  bySubject: [
    { subject: "Anatomy", completed: 8, total: 10, rate: 80 },
    { subject: "Physiology", completed: 5, total: 8, rate: 63 },
    { subject: "Biochemistry", completed: 5, total: 7, rate: 71 },
  ],
  competencies: [
    { code: "AN8.1", title: "Upper Limb Overview", subject: "Anatomy", status: "Completed", attempts: 1 },
    { code: "AN8.2", title: "Upper Limb - Bones and Joints", subject: "Anatomy", status: "Completed", attempts: 1 },
    { code: "AN9.1", title: "Lower Limb Overview", subject: "Anatomy", status: "Completed", attempts: 1 },
    { code: "PY1.1", title: "Cell Physiology", subject: "Physiology", status: "In Progress", attempts: 1 },
    { code: "PY1.2", title: "Muscle Physiology", subject: "Physiology", status: "Completed", attempts: 1 },
    { code: "BI1.1", title: "Biomolecules", subject: "Biochemistry", status: "Not Started", attempts: 0 },
  ],
};

export const mockRemediationReportData = {
  summary: {
    totalRemediations: 23,
    scheduled: 8,
    inProgress: 7,
    completed: 5,
    pending: 3,
  },
  remediations: [
    { id: "rem-1", student: "Aarav Patel", competency: "PY1.1 - Cell Physiology", faculty: "Dr. Sunita Devi", date: "2024-08-15", status: "Scheduled" },
    { id: "rem-2", student: "Priya Sharma", competency: "BI1.2 - Protein Structure", faculty: "Dr. Amit Singh", date: "2024-08-18", status: "In Progress" },
    { id: "rem-3", student: "Rohan Verma", competency: "AN9.2 - Lower Limb", faculty: "Dr. Rajesh Kumar", date: "2024-08-12", status: "Completed" },
    { id: "rem-4", student: "Sneha Reddy", competency: "PY2.1 - Cardiac Cycle", faculty: "Dr. Sunita Devi", date: "2024-08-20", status: "Pending" },
    { id: "rem-5", student: "Vikram Singh", competency: "BI3.1 - Glycolysis", faculty: "Dr. Amit Singh", date: "2024-08-22", status: "Scheduled" },
  ],
};

export const mockAuditReportData = {
  summary: {
    totalActions: 156,
    submissions: 89,
    acknowledgements: 45,
    assignments: 22,
  },
  recentActivity: [
    { action: "SUBMIT_ASSESSMENT", count: 89, lastActivity: "2024-08-20" },
    { action: "ACKNOWLEDGE_FEEDBACK", count: 45, lastActivity: "2024-08-19" },
    { action: "ASSIGN_COMPETENCY", count: 15, lastActivity: "2024-06-15" },
    { action: "ALLOCATE_STUDENT", count: 7, lastActivity: "2024-06-01" },
  ],
};
