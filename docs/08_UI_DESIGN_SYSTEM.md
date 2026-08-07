# MedTrack CBME UI Design System

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Design Philosophy

MedTrack CBME should feel like a modern healthcare SaaS platform: clean, minimal, professional, fast, accessible, consistent, and easy to learn.

The interface should prioritize academic workflows and productivity over decoration.

## Inspiration

Use modern enterprise product quality as inspiration:

- Notion.
- Linear.
- Vercel Dashboard.
- Microsoft 365 Admin.
- GitHub.
- shadcn/ui examples.

Do not copy another product directly.

## Theme

- Default: light mode.
- Dark mode: future phase.

## Color Roles

| Role | Color Family | Usage |
|---|---|---|
| Primary | Blue | Primary buttons, links, active navigation, highlights |
| Secondary | Slate / Gray | Text, borders, backgrounds |
| Success | Green | Completed, approved, success messages |
| Warning | Amber | Pending, waiting, attention required |
| Danger | Red | Validation errors, failed actions, critical alerts |
| Information | Sky Blue | Notifications and informational messages |

## Typography

| Token | Size |
|---|---:|
| Page Title | 32px |
| Section Title | 24px |
| Card Title | 18px |
| Body Text | 16px |
| Small Text | 14px |
| Caption | 12px |

Font: Inter. Fallback: system sans serif.

## Layout

| Token | Value |
|---|---|
| Maximum Content Width | 1280px |
| Standard Padding | 24px |
| Grid Gap | 24px |
| Card Padding | 24px |
| Border Radius | Large |

Cards should use subtle shadows.

## Page Structure

Every page follows:

```text
Header
-> Breadcrumb
-> Actions
-> Filters, if applicable
-> Main Content
-> Pagination, if applicable
```

## Cards

Cards are used for:

- Statistics.
- Information summaries.
- Quick actions.
- Dashboard sections.

Each card includes:

- Title.
- Optional icon.
- Main content.
- Optional footer.

## Tables

Use TanStack Table behavior:

- Pagination.
- Sorting.
- Search.
- Filters.
- Responsive layout.
- Loading state.
- Empty state.

Future table features:

- Column selection.
- Export.

## Forms

Every form includes:

- Label.
- Placeholder.
- Validation.
- Helper text where useful.
- Error message.

Button conventions:

- Primary: Save or submit action.
- Secondary: Cancel.
- Danger: Delete or destructive action.

## Dialogs

Use dialogs for:

- Delete confirmation.
- Edit record.
- Quick view.
- Small forms.

Large workflows should use dedicated pages.

## Feedback States

Toast notifications:

- Success: `Student Imported Successfully`.
- Error: `Unable to Save Assessment`.
- Warning: `Incomplete Form`.
- Information: `Assessment Assigned`.

Loading:

- Every page should have a loading skeleton.
- Processing buttons should show loading indicators.
- Avoid blank screens.

Empty states:

- Friendly message.
- Optional illustration.
- Primary action.

Error states:

- Clear message.
- Possible cause.
- Retry action.
- No technical error exposure.

## Status Badges

| Status | Color |
|---|---|
| Draft | Gray |
| Assigned | Blue |
| In Progress | Amber |
| Completed | Green |
| Needs Remediation | Red |
| Waiting for Student | Purple |

Badges must be consistent throughout the application.

## Icons and Charts

- Use Lucide Icons.
- Icons support usability but do not replace labels.
- Use Recharts for dashboard charts.

Dashboard charts may include:

- Competency progress.
- Department progress.
- Faculty performance.
- Assessment trends.
- Remediation statistics.

## Accessibility

Support:

- Keyboard navigation.
- Visible focus states.
- ARIA labels.
- Semantic HTML.
- Screen readers.
- Sufficient color contrast.

## Responsive Design

| Viewport | Behavior |
|---|---|
| Desktop | Primary layout with sidebar |
| Tablet | Adaptive layout |
| Mobile | Single-column layout and sidebar drawer |

Tables should support horizontal scrolling on narrow screens.

## Animation

Use subtle animation only:

- Dialog open.
- Dropdown.
- Toast.
- Accordion.

Avoid excessive motion.
