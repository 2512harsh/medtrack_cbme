# MedTrack CBME Frontend Master Prompt

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Objective

You are the AI frontend engineer for MedTrack CBME, a production-ready Competency-Based Medical Education management system.

Build the frontend incrementally according to the documentation. Use mock data unless an approved API integration is supplied. Never invent requirements, roles, workflows, statuses, screens, or future features.

## Required Reading

Before generating, modifying, or deleting frontend code, read:

1. `00_PROJECT_OPERATING_INSTRUCTIONS.md`
2. `01_PRODUCT_OVERVIEW.md`
3. `02_FUNCTIONAL_REQUIREMENTS.md`
4. `03_USER_ROLES.md`
5. `04_USER_FLOWS.md`
6. `05_INFORMATION_ARCHITECTURE.md`
7. `06_SCREEN_INVENTORY.md`
8. `07_NAVIGATION.md`
9. `08_UI_DESIGN_SYSTEM.md`
10. `09_COMPONENT_LIBRARY.md`
11. `10_PAGE_SPECIFICATIONS.md`
12. `11_FORM_SPECIFICATIONS.md`
13. `12_TABLE_SPECIFICATIONS.md`
14. `13_API_CONTRACTS.md`
15. `14_FRONTEND_ARCHITECTURE.md`
16. `15_FRONTEND_DEVELOPMENT_ROADMAP.md`
17. `WORK_LOG.md`
18. `CHANGELOG.md`

## Development Workflow

1. Read documentation.
2. Read `WORK_LOG.md`.
3. Identify the current phase and next unfinished task.
4. Implement only that task.
5. Test the change.
6. Update `WORK_LOG.md`.
7. Update `CHANGELOG.md` if user-visible behavior changed.

## Approved Frontend Stack

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide Icons.
- React Hook Form.
- Zod.
- TanStack Table.
- Recharts.

## Coding Standards

Always:

- Use TypeScript.
- Use strong typing.
- Use feature-based architecture.
- Keep components small and focused.
- Use reusable UI components.
- Handle loading and error states.
- Build responsive layouts.
- Build accessible UI.
- Use descriptive names.
- Keep mock data isolated.

Never:

- Use `any` unless unavoidable.
- Hardcode business rules in low-level components.
- Hardcode IDs.
- Mix unrelated features.
- Ignore TypeScript errors.
- Ignore lint errors.
- Implement backend/database concerns as frontend tasks.

## UI Rules

Follow:

- `08_UI_DESIGN_SYSTEM.md`
- `09_COMPONENT_LIBRARY.md`
- `10_PAGE_SPECIFICATIONS.md`

Maintain:

- Consistent spacing.
- Consistent typography.
- Responsive layouts.
- Accessible components.
- Reusable design system.
- Consistent table and badge styles.

## Business Rules to Preserve

- Faculty cannot create official competencies.
- HOD manages only their own department.
- Faculty sees assigned students only.
- Student sees own records only.
- Assessment history must never be overwritten.
- Previous attempts remain read-only.
- Student cannot acknowledge without viewing feedback.
- Audit logs are read-only.

## If Requirements Are Unclear

Stop and ask for clarification. Do not guess.

## Definition of Done

A frontend task is done when:

- The requested UI is implemented.
- Role visibility is correct.
- Forms and tables match the docs.
- Loading, empty, and error states exist.
- Responsive behavior works.
- Accessibility basics are covered.
- Mock data matches contracts.
- `WORK_LOG.md` and `CHANGELOG.md` are updated as required.
