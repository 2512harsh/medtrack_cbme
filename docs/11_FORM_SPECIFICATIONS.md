# MedTrack CBME Form Specifications

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Global Form Rules

Every form must include:

- Labels.
- Placeholders.
- Validation messages.
- Helper text where useful.
- Error messages.
- Save and Cancel buttons where applicable.
- Loading state during submission.

Use React Hook Form and Zod if implementing the documented stack.

## Login Form

| Field | Type | Required |
|---|---|---:|
| Email | Email input | Yes |
| Password | Password input | Yes |

Actions:

- Login.

Errors:

- Missing email.
- Invalid email.
- Missing password.
- Authentication failed.

## HOD Account Form

| Field | Type | Required |
|---|---|---:|
| First Name | Text | Yes |
| Last Name | Text | Yes |
| Email | Email | Yes |
| Department | Select | Yes |
| Status | Select | Yes |

## Faculty Form

| Field | Type | Required |
|---|---|---:|
| First Name | Text | Yes |
| Last Name | Text | Yes |
| Email | Email | Yes |
| Department | Select | Yes |
| Designation | Text | Yes |
| Employee Code | Text | Yes |
| Specialization | Text | No |
| Status | Select | Yes |

## Student Form

| Field | Type | Required |
|---|---|---:|
| First Name | Text | Yes |
| Last Name | Text | Yes |
| Email | Email | Yes |
| Roll Number | Text | Yes |
| Registration Number | Text | Yes |
| Stream | Select | Yes |
| Professional Year | Select | Yes |
| Batch | Text/Select | Yes |
| Admission Year | Number/Select | Yes |

## Student Import Form

| Field | Type | Required |
|---|---|---:|
| Import File | File input | Yes |
| Stream | Select | Yes |
| Professional Year | Select | Yes |
| Subject/Department Scope | Select | If applicable |

States:

- File selected.
- Uploading/importing.
- Validation errors.
- Import complete.

## Curriculum Forms

### Subject Form

| Field | Type | Required |
|---|---|---:|
| Professional Year | Select | Yes |
| Department | Select | Yes |
| Name | Text | Yes |
| Code | Text | Yes |

### Topic Form

| Field | Type | Required |
|---|---|---:|
| Subject | Select | Yes |
| Title | Text | Yes |
| Display Order | Number | No |

### Competency Form

Official competencies are imported, not manually created by faculty.

Frontend display fields:

- Competency code.
- Competency title.
- Competency description.
- Competency level.
- Core.
- Status.

## Student Allocation Form

| Field | Type | Required |
|---|---|---:|
| Faculty | Select | Yes |
| Students | Multi Select / table selection | Yes |
| Subject | Select | Yes |
| Allocation Date | Date | Auto/default |

Validation:

- At least one student must be selected.
- Faculty is required.
- Subject is required.

## Competency Assignment Form

| Field | Type | Required |
|---|---|---:|
| Subject | Select | Yes |
| Topic | Select | Yes |
| Competency | Select | Yes |
| Faculty | Select | Yes |
| Batch | Select/Text | Yes |
| Template | Select | Yes |

## Assessment Form

| Field | Type | Required |
|---|---|---:|
| Rating | Select/controlled input | Yes |
| Remarks | Textarea | Yes |
| Decision | Select | Yes |
| Faculty Signature | Signature input/text confirmation | Yes |

Allowed decisions:

- Meets Expectations.
- Exceeds Expectations.
- Needs Remediation.

Submission states:

- Draft.
- Submitting.
- Submitted.
- Failed with retry.

## Student Acknowledgement Form

| Field | Type | Required |
|---|---|---:|
| Feedback Read State | UI state | Yes |
| Acknowledgement Checkbox | Checkbox | Yes |
| Student Signature | Signature input/text confirmation | Yes |

Rules:

- Feedback must be visible before acknowledgement.
- Checkbox must be selected.
- Signature is required.

## Filter Forms

Common filters:

- Department.
- Faculty.
- Subject.
- Competency.
- Assessment status.
- Batch.

Filter controls must be reusable and consistent.
