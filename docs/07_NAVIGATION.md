# MedTrack CBME Navigation

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document defines route organization, sidebar behavior, header behavior, breadcrumbs, and role-based menu visibility.

## Layout

Desktop:

```text
Sidebar | Header
Sidebar | Main Content
```

Mobile:

```text
Header with menu trigger
Drawer navigation
Single-column content
```

## Sidebar Groups

| Group | Items |
|---|---|
| Dashboard | Role dashboard |
| Curriculum | Streams, Professional Years, Subjects, Topics, Competencies, Templates, Import |
| Faculty | Faculty Management, Assigned Students, Assigned Competencies |
| Students | Student Management, Student Import, Allocation, My Competencies |
| Assessments | Assessment Queue, Assessment History, Remediation |
| Reports | Student, Faculty, Department, Completion, Remediation, Audit |
| Notifications | Notifications |
| Settings | Profile, System or Department Settings |

## Role-Based Menu Visibility

| Menu Area | Super Admin | HOD | Faculty | Student |
|---|---:|---:|---:|---:|
| Dashboard | Yes | Yes | Yes | Yes |
| Institutions | Yes | No | No | No |
| Departments | Yes | Department summary | No | No |
| Curriculum | Yes | Yes | Assigned/readonly | Assigned/readonly |
| Faculty Management | No | Yes | No | No |
| Student Management | No | Yes | Assigned students | Own profile |
| Student Allocation | No | Yes | No | No |
| Competency Assignment | No | Yes | Assigned view | Assigned view |
| Assessments | No | Monitor | Yes | Feedback/acknowledgement |
| Reports | Platform | Department | Assigned scope | Own progress |
| Audit | Yes | Department scoped | No | No |
| Settings | Platform | Department/profile | Profile | Profile |

## Route Map

| Area | Route Pattern |
|---|---|
| Login | `/login` |
| Dashboards | `/dashboard/{role}` |
| Curriculum | `/curriculum/...` |
| Faculty | `/faculty/...` |
| Students | `/students/...` |
| Assessments | `/assessments/...` |
| Reports | `/reports/...` |
| Notifications | `/notifications` |
| Settings | `/settings` |

## Header Requirements

Header includes:

- Page title.
- Breadcrumb.
- Notifications.
- User profile menu.
- Search in a future phase.

## Breadcrumb Rules

- Breadcrumbs must match the current hierarchy.
- Breadcrumb text must use user-facing names, not internal IDs.
- Breadcrumbs must be present on detail pages and nested workflows.

Examples:

- `Dashboard / Curriculum / Subjects / Anatomy`
- `Dashboard / Faculty / Assigned Students / Student Detail`
- `Dashboard / Assessments / Assessment Detail / Attempt 1`

## Navigation States

Sidebar items must support:

- Default.
- Hover.
- Active.
- Collapsed.
- Disabled for future features, if shown.

## Access Denial

If a user reaches an unauthorized route:

- Show clear access-denied message.
- Do not expose technical details.
- Provide a return-to-dashboard action.
