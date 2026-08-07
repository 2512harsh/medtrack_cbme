# MedTrack CBME User Roles

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Role Model

MedTrack CBME supports four primary roles:

- Super Admin.
- Head of Department (HOD).
- Faculty.
- Student.

Each role has distinct navigation, page access, visible data, and permitted actions.

## Super Admin

### Responsibilities

- Manage institutions.
- Manage departments.
- Create HOD accounts.
- Manage system settings.
- Import official competency libraries.
- Monitor platform health.

### Restrictions

- Cannot perform faculty assessments.
- Cannot submit student acknowledgements.

### Primary Screens

- Super Admin Dashboard.
- Institutions.
- Departments.
- HOD Accounts.
- Competency Library Import.
- Platform Monitoring.
- Settings.

## HOD

Each department has one HOD. The HOD manages only their own department, such as Anatomy, Physiology, or Biochemistry.

### Responsibilities

- Create faculty accounts.
- Edit faculty information.
- Deactivate faculty.
- Import students.
- Allocate and reassign students.
- Assign competency templates.
- Monitor faculty progress.
- View department reports.

### Restrictions

- Cannot access other departments.
- Cannot modify official competency definitions.

### Primary Screens

- HOD Dashboard.
- Faculty Management.
- Student Management.
- Student Import.
- Student Allocation.
- Competency Assignment.
- Department Reports.

## Faculty

Faculty members receive students and competencies assigned by the HOD.

### Responsibilities

- View assigned students.
- View assigned competencies.
- Conduct competency assessments.
- Add remarks.
- Approve competencies.
- Recommend remediation.
- Digitally sign assessments.

### Restrictions

- Cannot create official competencies.
- Cannot allocate students.
- Cannot modify department settings.

### Primary Screens

- Faculty Dashboard.
- Assigned Students.
- Assigned Competencies.
- Assessment Form.
- Assessment History.
- Feedback and Signature.

## Student

Students access assigned competencies and participate in assessment acknowledgement.

### Responsibilities

- View assigned competencies.
- Submit competency responses where applicable.
- Review faculty feedback.
- Digitally acknowledge assessments.
- Track competency progress.

### Restrictions

- Cannot modify assessments after approval.
- Cannot edit faculty remarks.
- Cannot modify competency templates.

### Primary Screens

- Student Dashboard.
- My Competencies.
- Competency Detail.
- Assessment Feedback.
- Acknowledgement.
- Progress.

## Role Access Matrix

| Area | Super Admin | HOD | Faculty | Student |
|---|---:|---:|---:|---:|
| Dashboard | Yes | Yes | Yes | Yes |
| Institutions | Yes | No | No | No |
| Departments | Yes | Own department summary | No | No |
| HOD Accounts | Yes | No | No | No |
| Faculty Management | No | Yes | View self only | No |
| Student Management | No | Yes | Assigned students only | Own record only |
| Curriculum | Import/manage official library | Department/subject view | Assigned view | Assigned view |
| Student Allocation | No | Yes | View assigned | No |
| Competency Assignment | No | Yes | View assigned | View assigned |
| Assessment Review | No | Monitor | Yes | Read only after review |
| Student Acknowledgement | No | Monitor | Monitor | Yes |
| Reports | Platform/dept | Department | Assigned activity | Own progress |
| Audit | View | Department view | Own actions where exposed | Own actions where exposed |
| Settings | Platform | Department/profile | Profile | Profile |

## Data Visibility Rules

- HOD sees only their department.
- Faculty sees only assigned students and assigned competencies.
- Student sees only their own competencies, assessments, feedback, and progress.
- Super Admin sees platform-level configuration and monitoring surfaces.
