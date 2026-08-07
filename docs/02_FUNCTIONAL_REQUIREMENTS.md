# MedTrack CBME Functional Requirements

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document defines the frontend functional requirements for MedTrack CBME.

## Global Requirements

- Support four roles: Super Admin, HOD, Faculty, Student.
- Show only role-authorized navigation and actions.
- Provide dashboard summaries tailored to each role.
- Support responsive layouts for desktop, tablet, and mobile.
- Provide loading, empty, error, and success states on all interactive pages.
- Preserve the visibility of assessment attempts and history.
- Use frontend contracts from `13_API_CONTRACTS.md`.

## Authentication

- Provide secure login UI.
- Provide logout action.
- Provide current-user and profile surfaces.
- Show unauthorized or access-denied states when a role cannot access a route.
- Redirect authenticated users to the correct role dashboard.

## User Management

### Super Admin

- Manage institutions.
- Manage departments.
- Create HOD accounts.
- Monitor platform-level activity.

### HOD

- Create, edit, and deactivate faculty records.
- Import students.
- View and manage student records.
- Allocate students to faculty.
- Reassign students when allowed.
- Assign competency templates.

### Faculty

- View allocated students.
- View assigned competencies.
- Conduct assessments.
- Add remarks and decision.
- Digitally sign assessments.

### Student

- View assigned competencies.
- Submit competency responses where applicable.
- Review faculty feedback.
- Digitally acknowledge assessments.
- Track competency history.

## Curriculum Management

The frontend must support:

- Streams.
- Professional years.
- Subjects.
- Topics.
- Competencies.
- Question templates.
- Questions.
- Excel import UI for official competencies.

Business rules:

- Competencies are imported from official data.
- Faculty cannot create official competencies.
- Excel imports should create or update curriculum records without duplicating existing competencies.

## Student Allocation

The HOD must be able to:

- Select faculty.
- Select students.
- Assign selected students.
- Reassign students after competency completion.
- View allocation history.

Rules:

- One faculty may have many students.
- A student belongs to one faculty for a competency.
- Allocation history must be visible and preserved.

## Competency Assignment

The HOD must be able to:

- Select subject.
- Select topic.
- Select competency.
- Select faculty.
- Assign a competency template.

Faculty must see assigned templates in their dashboard and competency views.

## Assessment Workflow

Faculty assessment must support:

- Student selection.
- Competency selection.
- Question/template display.
- Rating input.
- Remarks input.
- Decision selection.
- Faculty digital signature.
- Submission confirmation.

Allowed decisions:

- Meets Expectations.
- Exceeds Expectations.
- Needs Remediation.

The UI must display:

- Faculty.
- Date.
- Time.
- Attempt number.
- Status.

## Student Acknowledgement

Students must:

- Open a completed faculty review.
- Read feedback before acknowledgement.
- Tick acknowledgement statement.
- Digitally sign.

The frontend must not allow acknowledgement until feedback has been viewed and the acknowledgement checkbox is selected.

## Remediation

If the faculty decision is `Needs Remediation`:

- The assessment is marked as repeat required.
- A next attempt is scheduled.
- Previous attempts remain read-only.
- Attempt history remains visible.

## Assessment History

Each attempt must display:

- Attempt number.
- Faculty rating.
- Faculty feedback.
- Faculty signature.
- Faculty timestamp.
- Student signature.
- Student timestamp.
- Decision.
- Status.

Nothing in the UI may overwrite or hide prior attempts.

## Notifications

Frontend notification categories:

| Role | Notifications |
|---|---|
| Faculty | Pending reviews, student acknowledgements, remediation due |
| Student | New assessment, feedback available, signature required, remediation scheduled |
| HOD | Pending faculty reviews, department progress, faculty activity |

## Reports

The frontend must provide report screens for:

- Student report.
- Faculty report.
- Department report.
- Competency completion report.
- Remediation report.
- Audit report.

PDF and Excel export controls may be shown as future-phase or disabled states until implemented.

## Mandatory Business Rules

- Users can only access data relevant to their role.
- Faculty cannot create official competencies.
- Students cannot edit faculty remarks.
- Students cannot modify assessments after approval.
- HODs cannot access other departments.
- Assessment attempts must never be overwritten.
- Audit logs are immutable and read-only in the UI.
