# MedTrack CBME Screen Inventory

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This inventory lists the frontend screens required for Version 1.

## Foundation Screens

| Screen | Route Pattern | Roles |
|---|---|---|
| Login | `/login` | All |
| Logout State | `/logout` or action state | All |
| Unauthorized | `/unauthorized` | All |
| Profile | `/profile` | All |
| Notifications | `/notifications` | All authenticated roles |

## Dashboard Screens

| Screen | Route Pattern | Roles |
|---|---|---|
| Super Admin Dashboard | `/dashboard/super-admin` | Super Admin |
| HOD Dashboard | `/dashboard/hod` | HOD |
| Faculty Dashboard | `/dashboard/faculty` | Faculty |
| Student Dashboard | `/dashboard/student` | Student |

## Super Admin Screens

| Screen | Purpose |
|---|---|
| Institutions | Manage medical colleges |
| Institution Detail | View institution departments and status |
| Departments | Manage departments |
| Department Detail | View HOD and department metadata |
| HOD Accounts | Create and manage HOD accounts |
| Competency Library Import | Import official competency libraries |
| Platform Monitoring | Monitor platform health and activity |
| System Settings | Manage platform-level settings |

## Curriculum Screens

| Screen | Purpose |
|---|---|
| Streams | MBBS and future stream structure |
| Professional Years | First Professional MBBS and future years |
| Subjects | Anatomy, Physiology, Biochemistry |
| Subject Detail | Topics and competency progress |
| Topics | Topic/module list |
| Topic Detail | Competencies under a topic |
| Competencies | Official competency list |
| Competency Detail | Template, questions, assignments, status |
| Question Templates | Template list and detail |
| Excel Import | Import/update official curriculum |

## HOD Screens

| Screen | Purpose |
|---|---|
| Faculty Management | Create, edit, deactivate faculty |
| Faculty Detail | Faculty subjects, students, activity |
| Student Management | View and manage students |
| Student Import | Bulk student import |
| Student Detail | Student profile, allocation, progress |
| Student Allocation | Assign students to faculty |
| Allocation History | Read-only allocation history |
| Competency Assignment | Assign templates to faculty |
| Department Progress | Monitor completion and remediation |

## Faculty Screens

| Screen | Purpose |
|---|---|
| Assigned Students | Faculty student list |
| Assigned Student Detail | Competencies and assessment status |
| Assigned Competencies | Faculty competency list |
| Competency Assessment Queue | Pending reviews |
| Assessment Form | Rating, remarks, decision, signature |
| Assessment Detail | Read-only submitted assessment |
| Assessment History | Attempts and remediation history |

## Student Screens

| Screen | Purpose |
|---|---|
| My Competencies | Assigned competency list |
| Competency Detail | Questions and status |
| Response Form | Student answers where applicable |
| Feedback View | Faculty review and remarks |
| Acknowledgement | Checkbox and digital signature |
| Progress | Completion and remediation tracking |
| Assessment History | Attempt history |

## Report Screens

| Screen | Roles |
|---|---|
| Student Report | HOD, Faculty, Student scoped views |
| Faculty Report | HOD, Faculty scoped view |
| Department Report | HOD |
| Competency Completion Report | HOD, Faculty scoped view |
| Remediation Report | HOD, Faculty scoped view |
| Audit Report | Super Admin, HOD scoped view |

## Future or Disabled Screens

The following must not be implemented as active Version 1 modules unless approved:

- Evidence upload.
- QR attendance.
- LMS integration.
- ERP integration.
- Payment and subscriptions.
- Multi-college management beyond platform administration.
- Custom institutional branding.
