# MedTrack CBME Page Specifications

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Page Specification Standard

Each page should define:

- Purpose.
- Route.
- Visible to.
- Header.
- Actions.
- Filters.
- Main content.
- Table or cards.
- Forms or dialogs.
- States.
- Navigation.
- Acceptance criteria.

## Login Page

- Route: `/login`.
- Visible to: all unauthenticated users.
- Purpose: authenticate users and route them to role dashboards.
- Fields: email, password.
- Actions: Login.
- States: loading, validation error, authentication error.
- Acceptance: valid credentials reach the correct role dashboard; invalid credentials show clear non-technical feedback.

## Role Dashboards

### HOD Dashboard

Shows:

- Total faculty.
- Total students.
- Pending assessments.
- Completed competencies.
- Remedial cases.
- Department progress.

### Faculty Dashboard

Shows:

- Assigned students.
- Pending reviews.
- Completed reviews.
- Awaiting student signature.
- Remediation cases.

### Student Dashboard

Shows:

- Assigned competencies.
- Pending assessments.
- Awaiting faculty review.
- Awaiting student signature.
- Completed competencies.
- Remediation required.

## Curriculum Pages

### Subjects

- Purpose: list Version 1 subjects.
- Content: Anatomy, Physiology, Biochemistry.
- Actions: view subject detail.
- Filters: professional year, department.
- States: loading, empty, error.

### Topic Detail

- Purpose: display competencies under a topic.
- Content: topic title, subject, competencies.
- Actions: view competency detail.

### Competency Detail

- Purpose: display official competency information and template.
- Content: code, title, description, level, core status, questions, assignment status.
- Restrictions: faculty and students view only assigned competencies.

### Excel Import

- Purpose: import official competency data.
- Visible to: Super Admin and authorized HOD surfaces if approved.
- States: file selected, parsing, validation errors, import success.
- Rule: imports create/update without duplicating competencies.

## HOD Pages

### Faculty Management

- Purpose: create, edit, deactivate faculty.
- Main content: faculty table.
- Actions: add faculty, edit, deactivate, view detail.
- Filters: subject, status, specialization.

### Student Management

- Purpose: import, view, and manage students.
- Main content: student table.
- Actions: import students, view detail, allocate.
- Filters: batch, subject, allocation status.

### Student Allocation

- Purpose: assign students to faculty.
- Layout: faculty selector, student selector, assignment summary.
- Acceptance: allocation history remains visible after assignment or reassignment.

### Competency Assignment

- Purpose: assign competency templates to faculty.
- Flow: subject -> topic -> competency -> faculty -> assign template.
- Acceptance: faculty dashboard updates after assignment.

## Faculty Pages

### Assigned Students

- Purpose: list students assigned to faculty.
- Actions: view student detail, open competency, open assessment.
- Filters: subject, competency status, remediation status.

### Assigned Competencies

- Purpose: show competencies assigned to faculty.
- Content: subject, topic, competency code, title, assigned batch, pending count.

### Assessment Form

- Purpose: record faculty evaluation.
- Fields: rating, remarks, decision, faculty signature.
- Decisions: Meets Expectations, Exceeds Expectations, Needs Remediation.
- Acceptance: submitted assessment moves to waiting for student acknowledgement or remediation path as documented.

## Student Pages

### My Competencies

- Purpose: list assigned competencies.
- Content: subject, topic, code, title, current status, attempt count.
- Actions: open competency, open feedback, acknowledge if required.

### Feedback View

- Purpose: show faculty rating, remarks, decision, signature, and timestamp.
- Acceptance: acknowledgement controls remain disabled until feedback has been viewed.

### Acknowledgement

- Purpose: student confirms they reviewed feedback.
- Fields: acknowledgement checkbox, digital signature.
- Acceptance: cannot submit without checkbox and signature.

## Report Pages

Reports should support filters, summary cards, tables, and chart panels where applicable.

Required reports:

- Student report.
- Faculty report.
- Department report.
- Competency completion report.
- Remediation report.
- Audit report.

Export to PDF and Excel is future-phase unless specifically implemented.
