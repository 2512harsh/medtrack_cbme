# MedTrack CBME Frontend Changelog

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Versioning

Use Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

- Major: breaking workflow, architecture, or role-access changes.
- Minor: new frontend screens, modules, or user-visible features.
- Patch: bug fixes, copy fixes, styling fixes, or small UI corrections.

## Release History

### Version 1.0.0

Status: Frontend Planning Complete

Release Date: TBD

#### Added

- Frontend operating instructions.
- Product overview.
- Functional requirements.
- User roles.
- User flows.
- Information architecture.
- Screen inventory.
- Navigation specification.
- UI design system.
- Component library.
- Page specifications.
- Form specifications.
- Table specifications.
- Frontend payload contracts.
- Frontend architecture.
- Frontend development roadmap.
- Frontend master prompt.
- Work log.
- Changelog.

#### Changed

- Reorganized the original full project documentation into a frontend-only documentation suite.
- Removed backend implementation details from the frontend scope.
- Converted API design into frontend payload contracts.
- Converted development phases into frontend implementation phases.

#### Fixed

- Not applicable.

#### Removed

- Backend implementation instructions from the frontend documentation set.
- Database implementation details from frontend build instructions.
- Security implementation internals from frontend task scope.

### Version 1.1.0

Release Date: 2026-08-06

#### Added

- Next.js 15 project with App Router, TypeScript, Tailwind CSS, ESLint
- shadcn/ui component library (button, input, card, form, table, dropdown-menu, avatar, tooltip, separator, sheet, dialog, alert, sonner)
- Documented folder structure per frontend architecture specification
- Type definitions matching API contracts (User, Institution, Department, Faculty, Student, Curriculum, Assessment, Notification, AuditLog)
- Authentication module with mock users, auth service, and React Context provider
- Login page with email/password form, validation (React Hook Form + Zod), loading/error states
- App shell layout with responsive sidebar navigation, header with breadcrumbs, user profile menu, notifications
- Role-based dashboard pages for Super Admin, HOD, Faculty, Student with stat cards and mock data
- Path aliases configuration (@/*)
- Production build verification

#### Changed

- Updated WORK_LOG.md to reflect Phase 1 completion
- Updated UI design system colors to use blue primary theme

### Version 1.2.0

Release Date: 2026-08-06

#### Added

- Unauthorized access page (`/unauthorized`) with access denied message and navigation actions
- Logout confirmation dialog in Header user menu using shadcn/ui Dialog component
- Profile settings page (`/settings/profile`) with personal information and password change forms
- Settings layout (`/settings/layout`) with navigation grid for future settings sub-pages
- Logout state management with confirmation flow
- Profile menu fully implemented in Header dropdown

#### Changed

- Updated WORK_LOG.md to reflect Phase 2 completion
- Updated Header to use sonner toast instead of deprecated toaster component
- Removed `asChild` prop usage from Button components (shadcn/ui v4 compatibility)

#### Fixed

- Fixed unescaped apostrophe in unauthorized page (react/no-unescaped-entities)
- Fixed DropdownMenuItem `asChild` prop compatibility issues

### Version 1.3.0

Release Date: 2026-08-06

#### Added

- Select component (shadcn/ui)
- Checkbox component (shadcn/ui)
- Switch component (shadcn/ui)
- Drawer component (shadcn/ui)
- Custom RadioGroup and RadioGroupItem components
- Custom DatePicker component with calendar icon
- StatusBadge component with 7 color variants (default, success, warning, danger, info, purple, gray)
- EmptyState component with icon, title, description, and optional action
- LoadingSkeleton component with row/column variants and page-level skeleton
- ErrorState component with title, message, and retry action
- FilterBar component with search, status, department, and batch filters
- DataTable component with TanStack Table v9 integration (sorting, filtering, pagination, search)
- Pagination component with page navigation and page size selection

#### Changed

- Updated WORK_LOG.md to reflect Phase 3 completion
- Added shadcn/ui components: select, checkbox, switch, drawer

#### Fixed

- Fixed unescaped apostrophe in unauthorized page (react/no-unescaped-entities)
- Fixed DropdownMenuItem `asChild` prop compatibility issues

### Version 1.4.0

Release Date: 2026-08-06

#### Added

- Curriculum UI screens (Phase 4):
  - Streams page (`/curriculum/streams`) with DataTable listing
  - Professional Years page (`/curriculum/professional-years`) with DataTable listing
  - Subjects page (`/curriculum/subjects`) with DataTable listing and subject detail page
  - Topics page (`/curriculum/topics`) with DataTable listing and topic detail page
  - Competencies page (`/curriculum/competencies`) with DataTable listing and competency detail page
  - Question Templates page (`/curriculum/templates`) with DataTable listing
  - Excel Import page (`/curriculum/import`) with file upload UI
  - Curriculum layout with sidebar navigation at `/curriculum`
- Curriculum mock data and services in `src/features/curriculum/`
- Curriculum hierarchy mock data (streams, professional years, subjects, topics, competencies, question templates)

#### Changed

- Updated WORK_LOG.md to reflect Phase 4 completion
- Updated Phase 5 as current phase
- Made curriculum pages client components for DataTable compatibility
- Fixed ColumnDef type issues across curriculum pages (using `ColumnDef<any, any>`)

#### Fixed

- Fixed sonner `toast` import error in Excel Import page (removed toast usage, using inline status instead)
- Fixed missing "use client" directive in curriculum pages

### Version 1.5.0

Release Date: 2026-08-06

#### Added

- HOD Module UI screens (Phase 5):
  - Faculty Management page (`/hod/faculty`) with DataTable listing, add/edit/deactivate actions
  - Student Management page (`/hod/students`) with DataTable listing, import/view/allocate actions
  - Student Import page (`/hod/students/import`) with file upload UI and validation errors
  - Student Allocation page (`/hod/allocations`) with DataTable listing and reassignment
  - Faculty Assignment page (`/hod/faculty-assignment`) with DataTable listing
  - Competency Assignment page (`/hod/competency-assignment`) with DataTable listing
  - Department Progress page (`/hod/progress`) with progress bars per subject
  - HOD layout with sidebar navigation at `/hod`
- HOD mock data and services in `src/features/hod/`
- Mock data for faculty, students, student allocations, and competency assignments
- HOD data services (CRUD operations for faculty, students, allocations, assignments)

#### Changed

- Updated WORK_LOG.md to reflect Phase 5 completion
- Updated Phase 6 as current phase
- Made HOD pages client components for DataTable compatibility
- Fixed ColumnDef type issues (using `ColumnDef<any, any>`)

#### Fixed

- Fixed `Link` name conflict in HOD layout (changed to `Link2` from lucide-react)

### Version 1.6.0

Release Date: 2026-08-06

#### Added

- Faculty Module UI screens (Phase 6):
  - Assigned Students page (`/faculty/assigned-students`) with DataTable listing
  - Assigned Competencies page (`/faculty/assigned-competencies`) with DataTable listing
  - Assessment Form page (`/faculty/assessment-form`) with rating, remarks, decision, signature fields
  - Assessment Detail page (`/faculty/assessment-detail`) with assessment history table
  - Faculty layout with sidebar navigation at `/faculty`
- Faculty mock data and services in `src/features/faculty/`
- Mock data for assigned students, assigned competencies, assessments, and assessment attempts
- Faculty data services (CRUD operations for assessments)

#### Changed

- Updated WORK_LOG.md to reflect Phase 6 completion
- Updated Phase 7 as current phase
- Made faculty pages client components for DataTable compatibility
- Fixed ColumnDef type issues (using `ColumnDef<any, any>`)

#### Fixed

- Fixed Select `onValueChange` type mismatch (null handling)
- Fixed `Object is of type 'unknown'` TypeScript error in assigned competencies page

### Version 1.7.0

Release Date: 2026-08-06

#### Added

- Student Module UI screens (Phase 7):
  - My Competencies page (`/student/my-competencies`) with DataTable listing
  - Competency Detail page (`/student/competency-detail`) with competency information display
  - Feedback View page (`/student/feedback`) with faculty feedback display
  - Digital Acknowledgement page (`/student/acknowledgement`) with checkbox and digital signature
  - Assessment History page (`/student/assessment-history`) with DataTable listing
  - Student layout with sidebar navigation at `/student`
- Student mock data and services in `src/features/student/`
- Mock data for student competencies, assessments, assessment attempts
- Student data services (acknowledge assessment, get progress)

#### Changed

- Updated WORK_LOG.md to reflect Phase 7 completion
- Updated Phase 8 as current phase
- Made student pages client components for DataTable compatibility
- Fixed ColumnDef type issues (using `ColumnDef<any, any>`)

#### Fixed

- Fixed TypeScript error: "Needs Remediation" is not assignable to AssessmentStatus
- Added "use client" directive to pages using DataTable component

### Version 1.8.0

Release Date: 2026-08-06

#### Added

- Assessment Lifecycle UI screens (Phase 8):
  - Attempt Timeline page (`/assessment/attempt-timeline`) with timeline visualization
  - Remediation Workflow page (`/assessment/remediation-workflow`) with remediation tracking
  - Status Transitions page (`/assessment/status-transitions`) with transition history
  - Notifications page (`/assessment/notifications`) with notification list
  - Audit Display page (`/assessment/audit-display`) with audit log table
  - Assessment layout with sidebar navigation at `/assessment`
- Assessment mock data and services in `src/features/assessment/`
- Mock data for notifications, audit logs, status transitions, remediation workflow
- Assessment data services (mark notifications as read, get audit logs)

#### Changed

- Updated WORK_LOG.md to reflect Phase 8 completion
- Updated Phase 9 as current phase
- Made assessment pages client components for DataTable compatibility
- Fixed ColumnDef type issues (using `ColumnDef<any, any>`)

#### Fixed

- Fixed import error: getMyAssessmentAttempts does not exist (changed to getAssessmentAttempts)
- Added "use client" directive to pages using DataTable component

### Version 1.9.0

Release Date: 2026-08-06

#### Added

- Reports and Analytics UI screens (Phase 9):
  - Student Report page (`/reports/student-report`) with summary cards and student details
  - Faculty Report page (`/reports/faculty-report`) with faculty activity metrics
  - Department Report page (`/reports/department-report`) with department progress bars
  - Competency Completion Report page (`/reports/competency-completion`) with completion rates
  - Remediation Report page (`/reports/remediation-report`) with remediation tracking
  - Audit Report page (`/reports/audit-report`) with activity summary
  - Reports layout with sidebar navigation at `/reports`
- Reports mock data and services in `src/features/reports/`
- Mock data for student reports, faculty reports, department reports, competency completion, remediation, and audit

#### Changed

- Updated WORK_LOG.md to reflect Phase 9 completion
- Updated Phase 10 as current phase

### Version 2.0.0

Release Date: 2026-08-06

#### Summary

Complete MedTrack CBME frontend implementation. All 10 phases delivered.

#### Added

- Phase 1: Frontend Foundation (Next.js 15, TypeScript, Tailwind, shadcn/ui, auth, dashboards)
- Phase 2: Authentication UI and Role Shells (unauthorized page, logout dialog, profile, settings)
- Phase 3: Design System and Shared Components (StatusBadge, EmptyState, LoadingSkeleton, ErrorState, FilterBar, DataTable, Pagination, DatePicker, RadioGroup)
- Phase 4: Curriculum UI (streams, professional years, subjects, topics, competencies, question templates, Excel import)
- Phase 5: HOD Module UI (faculty management, student management, student import, student allocation, faculty assignment, competency assignment, department progress)
- Phase 6: Faculty Module UI (assigned students, assigned competencies, assessment form, assessment detail)
- Phase 7: Student Module UI (my competencies, competency detail, feedback view, digital acknowledgement, assessment history)
- Phase 8: Assessment Lifecycle UI (attempt timeline, remediation workflow, status transitions, notifications, audit display)
- Phase 9: Reports and Analytics UI (student report, faculty report, department report, competency completion, remediation report, audit report)
- Phase 10: QA and Production Polish (build verification, lint review, documentation)

#### Statistics

- Total routes: 45
- Total features/modules: 10 phases
- Build status: Passing

#### Known Limitations

- TanStack Table v9 type compatibility requires `as any` assertions in DataTable component
- Export to PDF/Excel is future-phase (as documented)
- Mobile application is excluded from Version 1 scope
- AI-assisted assessment is excluded from Version 1 scope

### Version 2.1.0

Release Date: 2026-08-06

#### Added

- ErrorBoundary component to catch and recover from React crashes
- ConfirmationDialog component for destructive action confirmation
- Input sanitization utility to prevent XSS in search fields
- Loading states to async forms to prevent double submission
- File size validation to import forms (Student Import: 5MB, Curriculum Import: 10MB)
- Toast notifications for success/error feedback on form submissions
- Deactivate confirmation dialog in Faculty Management

#### Changed

- DataTable now sanitizes search input to prevent XSS
- Assessment Form shows loading spinner during submission
- Faculty Management requires confirmation before deactivating faculty
- Import forms show loading state during file processing

#### Fixed

- Prevented double form submission with loading states
- Added XSS protection for user input in search fields
- Added file size limits to prevent oversized uploads
- Added graceful error handling with ErrorBoundary

### Version 2.2.0

Release Date: 2026-08-06

#### Added

- Generic type parameter support in DataTable component
- Input sanitization for search fields to prevent XSS attacks
- ARIA labels to pagination buttons for accessibility
- ColumnMeta module extension for custom column metadata support

#### Changed

- DataTable now uses typed generic parameter `<TData>` for data arrays
- Improved sort indicator rendering in table headers
- Enhanced type safety in header group and row rendering

#### Fixed

- Sort indicator no longer uses unsafe object indexing
- Pagination buttons now have proper accessibility labels

### Version 2.3.0

Release Date: 2026-08-06

#### Added

- Custom not-found (404) page for unknown routes with navigation options

#### Changed

- DashboardLayout now shows loading state instead of blank page when unauthenticated
- Improved redirect flow to /login when accessing dashboard without authentication

#### Fixed

- 404 errors now show friendly page with navigation options
- Blank page flash eliminated during auth redirect

### Version 2.4.0

Release Date: 2026-08-06

#### Fixed

- All sidebar navigation links now point to valid routes
- Removed broken links: /settings/system, /settings/department, /students/allocation-history, /assessments/queue
- Fixed parent section links: /faculty, /students, /assessments, /reports, /notifications
- Fixed child links: /faculty/management, /students/management, /students/import, /students/allocation, /students/my-competencies, /assessments/history, /assessments/remediation, /reports/student, /reports/faculty, /reports/department, /reports/completion, /reports/remediation, /reports/audit

#### Added

- HOD Management section in sidebar with Faculty Assignment, Competency Assignment, Department Progress
- Faculty Assessment Form link in sidebar
- Student Feedback and Acknowledgement links in sidebar

### Version 2.5.0

Release Date: 2026-08-06

#### Added

- /dashboard route that redirects to role-specific dashboard based on user role
- Active route highlighting for sidebar submenu items
- Nested route active state support (e.g., /curriculum/subjects/123 highlights Subjects)

#### Changed

- Sidebar parent items now highlight when on any child route
- Sidebar child items now highlight for nested routes (not just exact matches)

### Version 2.6.0

Release Date: 2026-08-06

#### Added

- AsyncContent reusable component for loading/error/empty state handling
- Loading, error, and empty states to all curriculum feature tables
- Consistent async data fetching pattern across curriculum pages

#### Changed

- Curriculum pages now use client-side data fetching with state management
- DataTable components wrapped in AsyncContent for proper state handling

### Version 2.7.0

Release Date: 2026-08-06

#### Added

- Loading, error, and empty states to HOD Faculty Management page
- Loading, error, and empty states to HOD Student Management page
- Loading, error, and empty states to HOD Student Allocation page
- Loading, error, and empty states to Faculty Assigned Students page
- Loading, error, and empty states to Faculty Assigned Competencies page
- Loading, error, and empty states to Student My Competencies page
- Loading, error, and empty states to Student Assessment History page

### Version 2.8.0

Release Date: 2026-08-06

#### Added

- Loading, error, and empty states to all 6 report pages
- Student Report, Faculty Report, Department Report
- Competency Completion Report, Remediation Report, Audit Report

### Version 2.9.0

Release Date: 2026-08-06

#### Added

- Loading, error, and empty states to all 4 dashboard pages
- Super Admin Dashboard, HOD Dashboard, Faculty Dashboard, Student Dashboard
- PageLoadingSkeleton for dashboard loading state
- Role-specific empty state messages
- Non-technical error states with retry functionality

### Version 2.10.0

Release Date: 2026-08-06

#### Added

- Shared StatCard component (src/components/shared/StatCard.tsx) with ProgressBar export
- AsyncContent state handling to assessment/audit-display, hod/competency-assignment, hod/faculty-assignment pages

#### Changed

- Converted 5 async client components to useEffect + useState pattern (curriculum/competencies/[id], curriculum/subjects/[id], curriculum/topics/[id], faculty/assessment-detail, hod/progress)
- All 4 dashboard pages now import shared StatCard instead of local duplicates
- All client data-fetching pages now use consistent useEffect + state handling pattern

### Version 2.11.0

Release Date: 2026-08-06

#### Added

- Settings sub-pages /settings/notifications, /settings/appearance, /settings/security (previously 404)
- ThemeProvider (next-themes) in Providers and suppressHydrationWarning on <html> for theme support

#### Changed

- Header dropdown triggers use Base UI `render` prop (fixes nested <button> elements that broke clicks)
- Sidebar mobile SheetTrigger uses `render` prop (same nested-button fix)
- Header links updated: notifications -> /assessment/notifications, settings -> /settings/profile
- Header breadcrumbs only render links to existing routes; intermediate non-route segments are plain text
- Sidebar /curriculum parent renders as non-clickable section header (no page exists)

#### Fixed

- Buttons in Header/Sidebar triggers not responding (nested <button> invalid HTML)
- Links to non-existent routes causing 404 crashes: /notifications, /settings, /settings/*

### Version 2.12.0

Release Date: 2026-08-06

#### Added

- Forgot Password page (/forgot-password) - fixes 404 from LoginForm "Reset it" link
- Mobile sidebar sheet closes automatically when a navigation link is clicked

#### Changed

- Sidebar NavItem links accept onNavigate callback to close mobile drawer on navigation

#### Fixed

- Completeness audit verified all sidebar/header links resolve to existing routes
- Mobile drawer staying open after navigation (could appear as broken navigation)

### Version 2.13.0

Release Date: 2026-08-06

#### Added

- HOD Faculty Detail page (/hod/faculty/[id]) with profile, assigned competencies, and allocated students
- HOD Student Detail page (/hod/students/[id]) with registration, batch, and allocation coverage
- Faculty Assigned Student Detail page (/faculty/assigned-students/[id]) with assessment list
- HOD Allocation History page (/hod/allocation-history) with Active/Inactive badges
- Faculty Assessment Queue page (/faculty/assessment-queue) linking into the assessment form
- Student Progress page (/student/progress) with subject-wise ProgressBar and overall stat cards
- getAllocationHistory service in HOD module

#### Changed

- Faculty/Student name cells in list pages now link to their detail pages
- Sidebar navigation: added Assessment Queue (Faculty), Allocation History (HOD), My Progress (Student)
- Breadcrumb validation and route labels updated for the new routes
- Detail pages now use StatusBadge variant/children props correctly

#### Fixed

- StatusBadge type error (was passing `status` instead of `variant` + children) in the three detail pages

### Version 2.14.0

Release Date: 2026-08-06

#### Added

- Super Admin Institutions page (/super-admin/institutions) with create dialog and status toggle
- Super Admin Institution Detail page (/super-admin/institutions/[id]) with departments and contact/location
- Super Admin Departments page (/super-admin/departments) with create dialog, institution + HOD columns, status toggle
- Super Admin Department Detail page (/super-admin/departments/[id]) with institution link, HOD, and metadata
- Super Admin HOD Accounts page (/super-admin/hod-accounts) with create HOD account dialog and status toggle
- Super Admin Competency Import page (/super-admin/competency-import) with file picker, latest import status, and history table
- Super Admin Platform Monitoring page (/super-admin/monitoring) with stats, resource bars, and recent activity
- Super Admin System Settings page (/super-admin/system-settings) with platform identity, assessment config, workflow switches
- New feature module: src/features/super-admin (mock data + services for institutions, departments, HOD accounts, platform metrics, system settings, competency import, dashboard stats)
- Optional status field added to Institution and Department types

#### Changed

- Added "Platform Admin" sidebar group (Super Admin only) with Institutions, Departments, HOD Accounts, Competency Import, Platform Monitoring, System Settings
- Super Admin dashboard now loads data from getDashboardStats service (dynamic institutions, recent activity)
- Super Admin dashboard Quick Actions now link to the new module routes
- Header breadcrumb labels and valid routes added for all new routes

#### Fixed

- Super Admin dashboard used hard-coded institution/activity data and non-functional quick action buttons

### Version 2.15.0

Release Date: 2026-08-06

#### Added

- Student Response Form (/student/response/[id]) - renders competency questions as a textarea form
- Required question validation with inline error list
- Submit response (moves assessment to Submitted) and Save Draft actions
- My Competencies table now links to the response form via the code cell and an "Answer" action button

#### Changed

- Student service: added saveStudentResponse, submitStudentResponse, getStudentResponse and SubmitStudentResponsePayload
- Header breadcrumb support for the response route

### Version 2.16.0

Release Date: 2026-08-06

#### Added

- Student Evidence Upload (/student/evidence) - competency selector, file upload with PENDING/APPROVED/REJECTED status
- Faculty QR Attendance (/faculty/qr-attendance) - live QR code card, session list, activate/stop QR, create-session dialog
- LMS Integration (/integrations/lms) - connection cards, connect/disconnect workflows, sync
- Billing & Subscriptions (/billing) - subscription stats/cards, upgrade dialog, invoice history
- Institutional Branding (/super-admin/branding) - color/logo/copy customization with live preview
- New feature module: src/features/advanced (mock + services for all five areas)

Note: These areas were previously documented as "future or disabled" Version 1 exclusions but were built as full screens per explicit user request.

#### Changed

- Sidebar: Platform Admin group gains LMS, Billing, Branding; Faculty group gains QR Attendance; Students group gains Evidence Upload
- Header breadcrumb labels + valid routes for all new routes
- eslint.config.mjs: relaxed react-hooks/set-state-in-effect to "off" (per user decision) - removes legacy fetch-in-effect lint noise without refactoring existing pages

### Version 2.17.0

Release Date: 2026-08-06

#### Added

- DataTable now exports an `AppTableFeatures` type; the columns prop is fully typed as `ColumnDef<AppTableFeatures, TData>[]` so pages no longer need `ColumnDef<any, any>`
- Detailed pages (institutions/departments `[id]`) navigate via `useRouter().push()` instead of `window.location.href`

#### Changed

- Code hygiene sweep (QA/polish): `npx eslint .` now exits 0 with zero output and `npx tsc --noEmit` is clean; production build passes at 64 routes
- Removed all 66 explicit `any` usages: 27 pages retyped from `ColumnDef<any, any>` to `ColumnDef<AppTableFeatures, XRow>`; DataTable internal tanstack API typed via a documented `TableApi` interface instead of `as any` casts
- Removed ~39 unused imports/vars (icons, Button, Link, StatusBadge, unused destructured values, unused `catch (err)` bindings)
- Rewrote 9 detail-page effects: `fetchData` wrapped in `useCallback([params.id])` and effects depend on `[fetchData]`, resolving react-hooks/exhaustive-deps

### Version 3.0.0

Release Date: 2026-08-23

#### Added

- Real Postgres/Drizzle database: full schema, seed script, DB client (`src/db/`)
- Real session-based auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `src/lib/session.ts`, `src/lib/password.ts`
- Curriculum module fully live: API routes for competencies, subjects, topics, subtopics, professional-years, streams, departments; real bulk competency import (`/api/curriculum/import` + `parseImportFile.ts`) replacing the mock import flow
- Dean module fully live: API routes for faculty, students, HODs, competency-assignments, student-allocations, deans, institutions
- Assessment API routes: `/api/assessments`, `/api/assessments/[id]`, `/api/assessments/[id]/acknowledge`, `/api/assessment-attempts`
- `DataSourceBadge` component to flag which screens are still mock vs. live during the transition
- New `/super-admin/deans` page

#### Changed

- `select` components now key off record `id` instead of display label, avoiding collisions on duplicate labels once data is live

#### Removed

- Mock-only "advanced" screens with no real backend (`/billing`, `/integrations/lms`, `/super-admin/branding`, `/super-admin/monitoring`, `/super-admin/system-settings`, old `/super-admin/competency-import`)

### Version 3.1.0

Release Date: 2026-08-26

#### Added

- Department-scoped data access: `src/lib/curriculum-scope.ts` + `src/lib/api-auth.ts` restrict curriculum and dean queries to the caller's department
- Pagination on `super-admin/institutions` and `super-admin/departments` list pages

#### Fixed

- Dean module forms/pages (faculty, students, HOD, allocations) corrected for the live data shape
- `/api/dean/student-allocations` and `/api/super-admin/deans` follow-up fixes

## Future Entry Template



















### Version X.Y.Z

Release Date: YYYY-MM-DD

#### Added

- New frontend screens or features.

#### Changed

- Updated frontend behavior, navigation, components, or documentation.

#### Fixed

- Frontend defects fixed.

#### Removed

- Removed frontend behavior or deprecated UI.

## Update Rules

Update this file when:

- A frontend feature is added.
- A screen changes.
- A workflow changes.
- Navigation changes.
- Component behavior changes.
- Frontend contracts change.
- Documentation changes materially.

Do not update this file for whitespace-only changes.
