# MedTrack CBME Product Overview

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Product Name

MedTrack CBME

## Product Type

Commercial SaaS web application.

## Product Description

MedTrack CBME is a Competency-Based Medical Education management system for medical colleges and educational institutions. It digitizes the paper logbook used in MBBS education and provides a structured workflow for competency-based learning, assessment, faculty feedback, student acknowledgement, and academic progress tracking.

The product follows the National Medical Commission CBME framework and is designed to simplify competency management for HODs, faculty members, and students.

## Vision

Replace manual competency logbooks with a centralized digital competency management experience that improves:

- Faculty productivity.
- Student learning visibility.
- Academic transparency.
- Assessment tracking.
- Institutional reporting.
- Audit readiness.

## Problem Statement

Paper logbooks are difficult to maintain, rely on manual signatures, provide no centralized reporting, and make competency completion hard to track. MedTrack CBME solves these problems through a digital role-based workflow.

## Version 1 Scope

Version 1 supports:

- Stream: MBBS.
- Professional Year: First Professional MBBS.
- Subjects: Anatomy, Physiology, Biochemistry.
- Roles: Super Admin, HOD, Faculty, Student.
- Core modules: authentication UI, role-based dashboards, curriculum, HOD administration, faculty assessment, student acknowledgement, reports, notifications, and settings.

Future professional years and medical programs must be supported by the frontend architecture without requiring major redesign.

## Academic Hierarchy

```text
MBBS
-> Professional Year
-> Subject
-> Topic / Module
-> Competency
-> Assessment Template
-> Faculty Assessment
-> Student Acknowledgement
```

Example:

```text
MBBS
-> First Professional
-> Anatomy
-> Upper Limb
-> AN8.2
-> Competency Questions
-> Faculty Evaluation
```

## Core Product Modules

| Module | Frontend Scope |
|---|---|
| Foundation | Authentication UI, role-aware dashboard shell, user profile, protected route states |
| Curriculum Management | Streams, professional years, subjects, topics, competencies, question templates, Excel import UI |
| HOD Module | Faculty management, student management, allocation, competency assignment, department reports |
| Faculty Module | Assigned students, assigned competencies, assessment workflow, remarks, digital signature |
| Student Module | Assigned competencies, responses where applicable, feedback review, digital acknowledgement, progress |
| Reports & Analytics | Student, faculty, department, competency completion, remediation, and audit report screens |

## Assessment Philosophy

MedTrack CBME is not a traditional online examination system. It supports competency-based assessment where faculty evaluate students against predefined competencies, provide feedback, and students acknowledge the result.

## Success Criteria

The frontend is successful when it:

- Replaces the manual logbook experience with clear digital workflows.
- Makes faculty assessment efficient.
- Makes student progress visible.
- Preserves the complete assessment lifecycle in the UI.
- Supports institutional reporting.
- Scales visually and structurally to future departments and professional years.
- Delivers a modern, responsive, accessible user experience.

## Future Enhancements Excluded From Version 1

- Mobile application.
- AI-assisted feedback.
- Evidence upload.
- QR attendance.
- LMS and ERP integration.
- Payment and subscription management.
- Multi-college support.
- Custom institutional branding.
