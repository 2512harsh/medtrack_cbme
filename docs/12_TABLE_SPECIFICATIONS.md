# MedTrack CBME Table Specifications

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Global Table Rules

Use TanStack Table behavior for data tables.

Required features:

- Pagination.
- Sorting.
- Search.
- Filters.
- Responsive layout.
- Loading state.
- Empty state.

Future features:

- Column selection.
- Export.

## Common Table States

- Loading skeleton.
- Empty message and primary action.
- Error message with retry.
- Filtered-empty message.
- Selected rows where bulk action is available.

## Institution Table

Columns:

- Name.
- Code.
- City.
- State.
- Email.
- Phone.
- Status.
- Actions.

## Department Table

Columns:

- Name.
- Description.
- HOD.
- Institution.
- Status.
- Actions.

## Faculty Table

Columns:

- Name.
- Email.
- Department.
- Designation.
- Employee Code.
- Specialization.
- Status.
- Actions.

Filters:

- Department.
- Status.
- Subject/specialization where available.

## Student Table

Columns:

- Name.
- Email.
- Roll Number.
- Registration Number.
- Stream.
- Professional Year.
- Batch.
- Admission Year.
- Allocation Status.
- Actions.

Filters:

- Batch.
- Professional Year.
- Allocation status.
- Subject where applicable.

## Subject Table

Columns:

- Name.
- Code.
- Professional Year.
- Department.
- Topic Count.
- Competency Count.
- Actions.

## Topic Table

Columns:

- Title.
- Subject.
- Display Order.
- Competency Count.
- Actions.

## Competency Table

Columns:

- Competency Code.
- Competency Title.
- Subject.
- Topic.
- Competency Level.
- Core.
- Status.
- Actions.

Filters:

- Subject.
- Topic.
- Status.
- Core.

## Question Template Table

Columns:

- Title.
- Competency Code.
- Competency Title.
- Question Count.
- Instructions.
- Actions.

## Student Allocation Table

Columns:

- Faculty.
- Student.
- Subject.
- Allocated By.
- Allocated Date.
- Active.
- Actions.

Rules:

- History is read-only.
- Previous allocations must remain visible.

## Competency Assignment Table

Columns:

- Faculty.
- Competency Code.
- Competency Title.
- Subject.
- Topic.
- Batch.
- Assigned By.
- Assigned Date.
- Actions.

## Assessment Table

Columns:

- Student.
- Competency Code.
- Competency Title.
- Current Attempt.
- Current Status.
- Decision.
- Faculty.
- Updated Date.
- Actions.

Status values:

- Draft.
- Assigned.
- In Progress.
- Submitted.
- Reviewed.
- Waiting for Student Acknowledgement.
- Completed.
- Repeat Scheduled.

## Assessment Attempt Table

Columns:

- Attempt Number.
- Faculty.
- Rating.
- Decision.
- Faculty Signed At.
- Student Acknowledged.
- Student Signed At.
- Status.
- Actions.

Rule:

- Previous attempts are read-only.

## Notification Table/List

Columns or list fields:

- Title.
- Message.
- Type.
- Read state.
- Created At.
- Actions.

## Audit Table

Columns:

- User.
- Action.
- Entity.
- Entity ID.
- Created At.
- IP Address, if exposed by contract.

Rules:

- Read-only.
- Cannot be modified or deleted from the UI.
