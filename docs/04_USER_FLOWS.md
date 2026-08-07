# MedTrack CBME User Flows

Version: 1.0

> Source basis: MedTrack CBME full document prompt. This frontend suite preserves frontend-relevant requirements from the source and excludes backend implementation details.


## Overall Flow

```text
Super Admin
-> Creates Department
-> Creates HOD
-> HOD Creates Faculty
-> HOD Imports Students
-> HOD Allocates Students
-> HOD Assigns Competency Templates
-> Faculty Conducts Assessment
-> Student Reviews Feedback
-> Student Acknowledges
-> Completed
```

## Super Admin Flow

```text
Login
-> Dashboard
-> Create Department
-> Create HOD
-> Manage Departments
-> Import Competency Library
-> Monitor Platform
```

## HOD Flow

```text
Login
-> Dashboard
-> Faculty Management
-> Import Students
-> Allocate Students
-> Assign Faculty
-> Assign Competency Templates
-> Monitor Progress
-> Reports
```

## Faculty Flow

```text
Login
-> Dashboard
-> View Assigned Students
-> Select Subject
-> Select Topic
-> Select Competency
-> Open Assessment
-> Evaluate Student
-> Submit Assessment
```

Faculty records rating, feedback, and decision.

## Student Flow

```text
Login
-> Dashboard
-> View Assigned Competencies
-> Open Competency
-> Answer Questions, if applicable
-> Submit
-> Wait for Faculty Review
-> Receive Feedback
-> Read Feedback
-> Digital Acknowledgement
-> Completed
```

## Student Allocation Flow

```text
HOD
-> Select Faculty
-> Select Students
-> Assign
-> System Saves Allocation
-> Faculty Dashboard Updated
```

## Competency Assignment Flow

```text
HOD
-> Select Subject
-> Select Topic
-> Select Competency
-> Select Faculty
-> Assign Template
-> Faculty Receives Assignment
```

## Assessment Decision Flow

### Meets or Exceeds Expectations

```text
Faculty Evaluation
-> Meets Expectations or Exceeds Expectations
-> Faculty Signature
-> Waiting for Student Acknowledgement
-> Student Acknowledgement
-> Completed
```

### Needs Remediation

```text
Faculty Evaluation
-> Needs Remediation
-> Faculty Signature
-> Waiting for Student Acknowledgement
-> Student Acknowledgement
-> Reattempt Scheduled
```

## Student Acknowledgement Flow

```text
Notification
-> Open Assessment
-> Read Feedback
-> Tick Acknowledgement
-> Digital Signature
-> Completed
```

The student must not be able to acknowledge without viewing faculty feedback.

## Remediation Flow

```text
Faculty selects Needs Remediation
-> Student Reviews Feedback
-> Student Acknowledges
-> Reattempt Scheduled
-> Faculty Opens Attempt 2
-> Faculty Evaluates Again
-> Completed or Repeat Required
```

Maximum attempts should be configurable by the institution.

## Status Flow

Standard completion:

```text
Draft
-> Assigned
-> In Progress
-> Submitted
-> Faculty Reviewed
-> Waiting for Student Acknowledgement
-> Completed
```

Remediation:

```text
Faculty Reviewed
-> Needs Remediation
-> Waiting for Student Acknowledgement
-> Reattempt Scheduled
-> Completed
```

## Error Handling Flow

If assessment submission fails:

```text
Retry
-> Save Draft
-> Notify User
```

If internet disconnects, local draft saving and automatic sync are future enhancements.

## Audit Flow

The frontend must surface audit-relevant actions where required:

- Login.
- Logout.
- Allocation.
- Reallocation.
- Assessment.
- Feedback.
- Approval.
- Student signature.
- Remediation.

Audit logs are read-only.
