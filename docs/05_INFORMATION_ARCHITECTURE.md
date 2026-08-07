# MedTrack CBME Information Architecture

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document organizes the frontend application into navigable areas, sections, and content relationships.

## Application Shell

The application uses:

- Left sidebar on desktop.
- Top header.
- Main content area.
- Optional footer.
- Mobile drawer navigation.

## Global Navigation Groups

- Dashboard.
- Curriculum.
- Faculty.
- Students.
- Assessments.
- Reports.
- Notifications.
- Settings.

Only authorized groups and items are visible for the active role.

## Academic Structure

```text
Stream
-> Professional Year
-> Subject
-> Topic
-> Competency
-> Question Template
-> Question
```

Version 1 content:

- Stream: MBBS.
- Professional Year: First Professional MBBS.
- Subjects: Anatomy, Physiology, Biochemistry.

## Assessment Structure

```text
Student
-> Assessment
-> Assessment Attempt
-> Faculty Review
-> Student Acknowledgement
```

## Primary Content Areas

| Area | Contains |
|---|---|
| Foundation | Login, dashboard shell, profile, unauthorized state |
| Administration | Institutions, departments, HOD accounts, platform settings |
| Curriculum | Streams, years, subjects, topics, competencies, templates |
| HOD Workspace | Faculty, students, allocation, assignments, department progress |
| Faculty Workspace | Assigned students, assigned competencies, assessment workflow |
| Student Workspace | Assigned competencies, responses, feedback, acknowledgement, progress |
| Reports | Student, faculty, department, completion, remediation, audit reports |
| Notifications | Role-specific alerts and read/unread states |

## Breadcrumb Pattern

Breadcrumbs should reflect hierarchy:

- Dashboard.
- Curriculum / Subjects / Anatomy / Upper Limb / AN8.2.
- Students / Student Detail / Assessment History.
- Assessments / Assessment Detail / Attempt 1.
- Reports / Department Report.

## Content Ownership

- Official curriculum belongs to the curriculum area.
- Department administration belongs to HOD workspace.
- Assessment entry belongs to Faculty workspace.
- Feedback acknowledgement belongs to Student workspace.
- Audit and reporting are read-only analytical areas.

## Future-Proofing

The information architecture must support:

- Additional professional years.
- Additional medical programs.
- Multiple institutions.
- Evidence uploads.
- AI-assisted features.
- Mobile applications.

These are not Version 1 implementation items unless approved.
