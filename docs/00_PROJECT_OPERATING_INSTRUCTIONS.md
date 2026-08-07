# MedTrack CBME Frontend Operating Instructions

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Purpose

This document defines how AI assistants and frontend developers must work on the MedTrack CBME frontend documentation and codebase.

The `/docs` folder is the source of truth for frontend behavior, screens, UI, payload contracts, workflows, and implementation order.

## Frontend Scope

Build only the frontend application experience for MedTrack CBME:

- Responsive web UI for Super Admin, HOD, Faculty, and Student roles.
- Role-based navigation and screen access.
- Frontend forms, tables, dashboards, reports, notifications, and assessment workflows.
- Mock-data-first development unless an approved integration is supplied.
- Frontend payload contracts only, not backend endpoint implementation.

Do not implement database schemas, Prisma migrations, password hashing, server-side authorization, deployment infrastructure, or backend logging as frontend tasks.

## Required Reading Order

Before generating or modifying frontend code, read:

1. `00_PROJECT_OPERATING_INSTRUCTIONS.md`
2. `16_MASTER_PROMPT.md`
3. `15_FRONTEND_DEVELOPMENT_ROADMAP.md`
4. `WORK_LOG.md`
5. `01_PRODUCT_OVERVIEW.md`
6. `02_FUNCTIONAL_REQUIREMENTS.md`
7. `03_USER_ROLES.md`
8. `04_USER_FLOWS.md`
9. `05_INFORMATION_ARCHITECTURE.md`
10. `06_SCREEN_INVENTORY.md`
11. `07_NAVIGATION.md`
12. `08_UI_DESIGN_SYSTEM.md`
13. `09_COMPONENT_LIBRARY.md`
14. `10_PAGE_SPECIFICATIONS.md`
15. `11_FORM_SPECIFICATIONS.md`
16. `12_TABLE_SPECIFICATIONS.md`
17. `13_API_CONTRACTS.md`
18. `14_FRONTEND_ARCHITECTURE.md`
19. `CHANGELOG.md`

## Development Rules

- Implement one roadmap phase at a time.
- Never invent modules, screens, roles, statuses, or workflows.
- Never build future enhancements unless explicitly approved.
- Preserve assessment history and attempt visibility in the UI.
- Keep mock data isolated from components.
- Keep business rules out of low-level UI components.
- Use reusable components for repeated layouts, forms, tables, badges, and feedback states.
- Build responsive desktop, tablet, and mobile behavior.
- Update `WORK_LOG.md` after each completed frontend session.
- Update `CHANGELOG.md` when user-visible frontend behavior changes.

## Resume Rule

When work resumes:

1. Read this file.
2. Read `WORK_LOG.md`.
3. Identify the current phase and first unfinished task.
4. Continue from that task.
5. Do not regenerate completed modules.

## UI Rules

- Follow `08_UI_DESIGN_SYSTEM.md`.
- Follow `09_COMPONENT_LIBRARY.md`.
- Follow `10_PAGE_SPECIFICATIONS.md`.
- Do not redesign existing components without approval.
- Use consistent status badges, spacing, typography, table behavior, and page structure.

## Mock Data Rules

- Mock data must match `13_API_CONTRACTS.md`.
- Mock records must reflect the source scope: MBBS, First Professional MBBS, Anatomy, Physiology, and Biochemistry.
- Do not use fake business states outside the documented statuses.
- Keep demo data realistic but clearly non-production.

## Quality Rules

Frontend code must be:

- TypeScript based.
- Strongly typed.
- Modular.
- Accessible.
- Responsive.
- Production ready.
- Easy to extend.
- Free from duplicated form/table logic.

Every screen must include appropriate loading, empty, error, and success states.

## Definition of Done

A frontend task is complete only when:

- The specified screen or component is implemented.
- Role visibility is respected.
- Responsive behavior works.
- Loading, empty, and error states exist where applicable.
- Form validation and messages match the documentation.
- Mock data follows frontend contracts.
- Navigation and breadcrumbs are correct.
- `WORK_LOG.md` is updated.
- `CHANGELOG.md` is updated for visible changes.
