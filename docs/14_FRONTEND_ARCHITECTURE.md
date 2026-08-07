# MedTrack CBME Frontend Architecture

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document defines the frontend architecture for MedTrack CBME.

## Approved Frontend Stack

- Next.js 15+ with App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide Icons.
- React Hook Form.
- Zod.
- TanStack Table.
- Recharts.
- npm.

## Frontend-Only Architecture

```text
Browser
-> Next.js App Router frontend
-> Feature modules
-> UI components
-> Hooks and services
-> Mock data or approved API contracts
```

Do not place backend implementation concerns in frontend components.

## Folder Structure

```text
app/
  (auth)/
  (dashboard)/
components/
  ui/
  shared/
  forms/
  tables/
  layout/
features/
  authentication/
  users/
  departments/
  curriculum/
  faculty/
  students/
  assessments/
  reports/
  notifications/
lib/
  permissions/
  validators/
  constants/
  utils/
types/
hooks/
styles/
docs/
```

Backend-only folders from the original full-stack plan, such as database migrations, are excluded from the frontend implementation unless a full-stack scope is separately approved.

## Feature Module Standard

Each feature should own:

- Components.
- Hooks.
- Services.
- Schemas.
- Types.
- Mock data where needed.

Example:

```text
features/assessments/
  components/
  hooks/
  services/
  schemas/
  types/
  mock/
```

## State Management

- Use React state whenever possible.
- Use Context API only for authentication, theme, and global settings.
- Avoid unnecessary global state libraries.
- Keep server/API data access behind feature services or hooks.

## Permissions

Every route and navigation item must evaluate:

- Authentication state.
- User role.
- Department access where applicable.
- Assignment scope for faculty and student views.

Client-side permission checks improve UX but do not replace backend authorization when a backend exists.

## Forms

- Use reusable field components.
- Use React Hook Form for form state.
- Use Zod schemas for frontend validation.
- Keep schemas close to the feature.
- Do not duplicate validation messages across screens.

## Tables

- Use TanStack Table for data-heavy pages.
- Use shared table primitives for sorting, filtering, pagination, selection, loading, empty, and error states.
- Table columns should be feature-specific but use shared column helpers where useful.

## Services

Frontend service functions should:

- Consume payload contracts from `13_API_CONTRACTS.md`.
- Return typed data.
- Hide transport details from components.
- Support mock implementations during mock-data-first development.

## Mock Data Strategy

- Keep mocks under `features/{module}/mock`.
- Match frontend contract shapes.
- Use Version 1 scope: MBBS, First Professional MBBS, Anatomy, Physiology, Biochemistry.
- Include realistic statuses and attempt examples.
- Avoid future features unless marked as disabled or future.

## Accessibility

Every page must support:

- Keyboard navigation.
- Semantic HTML.
- Visible focus states.
- Proper form labels.
- ARIA labels where needed.
- Sufficient color contrast.

## Responsive Strategy

- Desktop uses sidebar, header, content.
- Tablet adapts navigation and grid density.
- Mobile uses drawer navigation and single-column content.
- Tables support horizontal scroll.

## Performance Guidelines

- Prefer server-rendered/static UI where appropriate.
- Use Client Components only for interactivity.
- Lazy load heavy modules.
- Avoid unnecessary re-renders.
- Keep chart rendering scoped to dashboards and reports.

## Naming Conventions

- Components: `StudentCard.tsx`, `FacultyTable.tsx`, `AssessmentDialog.tsx`.
- Hooks: `useAssessment.ts`.
- Utilities: `formatDate.ts`.
- Schemas: `assessment.schema.ts`.
- Types: `assessment.types.ts`.

## Architecture Definition of Done

The frontend architecture is good when it is:

- Modular.
- Maintainable.
- Extensible.
- Accessible.
- Performant.
- Easy to test.
- Easy to understand.
