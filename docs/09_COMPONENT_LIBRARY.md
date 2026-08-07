# MedTrack CBME Component Library

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document defines reusable frontend components required to build MedTrack CBME consistently.

## Foundation Components

| Component | Purpose |
|---|---|
| AppShell | Sidebar, header, main content layout |
| Sidebar | Role-based navigation |
| Header | Page title, breadcrumb, notifications, profile menu |
| Breadcrumb | Hierarchical navigation |
| PageHeader | Title, description, primary actions |
| PageActions | Action button group |
| SectionHeader | Section title and optional helper text |

## Form Components

Use reusable components for:

- Text Input.
- Email Input.
- Password Input.
- Select.
- Multi Select.
- Date Picker.
- Search.
- Textarea.
- Checkbox.
- Radio.
- Switch.

Rules:

- Never duplicate form components.
- All form fields must support label, helper text, error text, disabled state, required state, and loading state where applicable.

## Data Components

| Component | Requirements |
|---|---|
| DataTable | Pagination, sorting, search, filters, loading, empty state |
| FilterBar | Department, faculty, subject, competency, status, batch filters |
| Pagination | Page size and page navigation |
| SortHeader | Sortable table column header |
| BulkActionBar | Visible only when rows are selected |
| DetailList | Key-value facts for profile/detail pages |

## Feedback Components

| Component | Purpose |
|---|---|
| StatusBadge | Consistent status display |
| Toast | Success, error, warning, information messages |
| LoadingSkeleton | Page and component loading state |
| EmptyState | Friendly no-data state with optional action |
| ErrorState | Clear recoverable error display |
| Alert | Important inline messages |

## Overlay Components

| Component | Usage |
|---|---|
| Dialog | Small forms, quick view, confirmation |
| ConfirmationDialog | Delete or irreversible actions |
| Drawer | Mobile sidebar or secondary workflow panel |
| DropdownMenu | Profile menu and row actions |
| Tooltip | Clarify icons or compact controls |

## Assessment Components

| Component | Purpose |
|---|---|
| CompetencyCard | Competency summary and status |
| CompetencyStatusBadge | Competency-specific status |
| AssessmentForm | Rating, remarks, decision, signature |
| AttemptTimeline | Attempt history |
| FacultySignatureBlock | Faculty sign-off display/input |
| StudentAcknowledgementBlock | Feedback read, checkbox, signature |
| RemediationNotice | Repeat-required state |

## Dashboard Components

| Component | Purpose |
|---|---|
| StatCard | Counts and KPI values |
| ProgressChart | Competency and department progress |
| RecentActivityList | Recent actions |
| PendingTaskList | Reviews, signatures, remediation |
| NotificationList | Role-specific notifications |

## Report Components

| Component | Purpose |
|---|---|
| ReportFilterPanel | Subject, faculty, batch, status filters |
| ReportSummaryCards | High-level report metrics |
| ReportTable | Report data with export-ready layout |
| ChartPanel | Recharts visualization container |

## Component States

Every applicable component must support:

- Default.
- Hover.
- Focus.
- Disabled.
- Loading.
- Error.
- Empty.
- Selected.

## Naming Conventions

Examples:

- `StudentCard.tsx`
- `FacultyTable.tsx`
- `AssessmentDialog.tsx`
- `useAssessment.ts`
- `assessment.schema.ts`
- `formatDate.ts`

## Implementation Rules

- Shared UI belongs in `components/ui`.
- Shared layout belongs in `components/layout`.
- Feature-specific components belong in `features/{module}/components`.
- Components must be typed.
- Components must not hardcode business data.
