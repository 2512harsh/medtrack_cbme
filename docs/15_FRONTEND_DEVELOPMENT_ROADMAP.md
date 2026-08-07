# MedTrack CBME Frontend Development Roadmap

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This roadmap converts the original project phases into frontend-only implementation phases.

## General Rules

- Complete one phase before starting the next.
- Use mock data first unless approved API integration exists.
- Update `WORK_LOG.md` after every session.
- Update `CHANGELOG.md` when visible frontend behavior changes.
- Do not implement future enhancements during Version 1.

## Phase 1 - Frontend Foundation

Objective: create the frontend application foundation.

Deliverables:

- Initialize Next.js project.
- Configure TypeScript.
- Configure Tailwind CSS.
- Install shadcn/ui.
- Configure ESLint.
- Configure Prettier.
- Create frontend folder structure.
- Configure path aliases.
- Create app shell.
- Create reusable UI components.
- Create authentication pages as UI.
- Verify build succeeds.

Exit criteria:

- Project runs locally.
- No TypeScript errors.
- No lint errors.
- Basic responsive shell is complete.

## Phase 2 - Authentication UI and Role Shells

Objective: create role-aware frontend access flows.

Deliverables:

- Login UI.
- Logout state.
- Current user mock/session state.
- Role-based dashboard routing.
- Unauthorized page.
- Profile menu.
- Role-aware sidebar.

Exit criteria:

- Each role lands on the correct dashboard.
- Unauthorized navigation shows the correct state.

## Phase 3 - Design System and Shared Components

Objective: implement the reusable UI system.

Deliverables:

- Buttons.
- Inputs.
- Selects.
- Textarea.
- Checkbox.
- Radio.
- Switch.
- Date picker.
- Dialog.
- Drawer.
- Toast.
- Status badge.
- Data table.
- Pagination.
- Filter bar.
- Empty, loading, and error states.

Exit criteria:

- Screens can be composed from shared components.
- Component states are consistent.

## Phase 4 - Curriculum UI

Objective: implement academic structure screens.

Deliverables:

- Streams.
- Professional years.
- Subjects.
- Topics.
- Competencies.
- Question templates.
- Excel import UI.

Exit criteria:

- Curriculum hierarchy can be browsed.
- Competency details and templates are visible.

## Phase 5 - HOD Module UI

Objective: support department administration.

Deliverables:

- HOD dashboard.
- Faculty management.
- Student management.
- Student import.
- Student allocation.
- Faculty assignment.
- Competency assignment.
- Department progress.

Exit criteria:

- HOD can navigate complete department workflow using mock data.
- Allocation history is visible.

## Phase 6 - Faculty Module UI

Objective: support faculty assessment workflows.

Deliverables:

- Faculty dashboard.
- Assigned students.
- Assigned competencies.
- Assessment form.
- Faculty remarks.
- Faculty signature.
- Assessment detail.

Exit criteria:

- Faculty can complete an assessment flow in the UI.

## Phase 7 - Student Module UI

Objective: support student competency and feedback experience.

Deliverables:

- Student dashboard.
- My competencies.
- Competency detail.
- Feedback view.
- Digital acknowledgement.
- Progress tracking.
- Assessment history.

Exit criteria:

- Student can review feedback and acknowledge an assessment in the UI.

## Phase 8 - Assessment Lifecycle UI

Objective: complete end-to-end status and attempt behavior.

Deliverables:

- Attempt timeline.
- Remediation workflow.
- Status transitions.
- Assessment history.
- Notifications.
- Audit-relevant display states.

Exit criteria:

- Multiple attempts are visible and previous attempts are read-only.
- Remediation path is represented accurately.

## Phase 9 - Reports and Analytics UI

Objective: provide report and dashboard analytics screens.

Deliverables:

- Student reports.
- Faculty reports.
- Department reports.
- Competency completion reports.
- Remediation reports.
- Audit report.
- Dashboard charts.
- Export-ready UI states.

Exit criteria:

- Report screens display filtered mock data and meaningful empty/loading/error states.

## Phase 10 - QA and Production Polish

Objective: prepare frontend for production use.

Deliverables:

- Responsive QA.
- Accessibility review.
- Performance review.
- Manual workflow testing.
- Documentation review.
- Final visual polish.

Exit criteria:

- Production build succeeds.
- No critical frontend issues remain.
- Documentation reflects implementation.

## Version 1 Exclusions

Do not implement:

- Mobile application.
- AI-assisted assessment.
- Evidence upload.
- QR attendance.
- ERP/LMS integration.
- Payment and subscriptions.
- Institution branding.
- Email/SMS notifications.
