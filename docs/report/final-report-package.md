# Final Report Package

This Markdown file is the source outline for the final Word report. Copy the sections into the required Word template and attach selected screenshots when needed.

## 1. Project Introduction

Project: Lab Schedule PTIT - MVP for assigning practical lab schedules.

Problem: lab schedules must respect room availability, lecturer availability, room capacity, software, holidays, and maintenance blocks.

MVP scope:

- rooms `2B11`, `2B21`, `2B31`
- roles QTV, CBDT, GV, KTV, SV
- rule-based auto-arrange, not global timetable optimization
- no real UIS synchronization

## 2. Technology Stack

- Frontend: Next.js, React
- Backend: Node.js, Express.js
- Database: MySQL
- Testing: Postman, local API checks
- Documentation: Markdown, Word report

## 3. Implemented Features

| Area | Status | Verification |
| --- | --- | --- |
| Auth/RBAC | Done | TC01-TC06 |
| Schedule request | Done | TC07-TC08 |
| Constraint checks | Done | TC09-TC14 |
| Auto-arrange | Done | TC15-TC17 |
| Schedule lifecycle | Done | TC18-TC19 |
| Schedule change request | Done | TC20 |
| Room issue/block | Done | TC21-TC22 |
| Feedback/notifications | Done | TC23-TC24 |
| Admin/master CRUD + audit logs | Done | Manual/API checks |
| Frontend integration | Done | Local route checks |
| Basic reports | Done | TC25 |

## 4. Main Use Cases

- CBDT creates a lab schedule request.
- System checks constraints and ranks room/time options.
- CBDT creates draft schedule from a valid option.
- CBDT/QTV approves and publishes the schedule.
- SV/GV/KTV views published schedules.
- GV submits schedule change request.
- CBDT reviews and implements approved changes.
- GV/KTV reports room issues.
- KTV proposes room blocks; CBDT/QTV reviews.
- SV submits feedback; CBDT/QTV responds.
- Users read/acknowledge notifications.
- CBDT/QTV views basic report metrics.

## 5. Data Design Summary

Core tables:

- `users`
- `rooms`
- `devices`
- `software_packages`
- `schedule_requests`
- `lab_schedule_entries`
- `lab_schedule_change_requests`
- `room_issue_reports`
- `room_block_requests`
- `student_feedback`
- `notifications`
- `notification_recipients`
- `workflow_audit_logs`

## 6. Testing Summary

Final status:

- TC01-TC25: verified with Postman collection and local UI checks.
- Backend endpoints were checked with the local database seed.
- Frontend routes were checked through the browser after API integration.

## 7. Demo Notes

- Reset the database with `scripts/reset-demo-db.ps1` before presenting.
- Use the seeded accounts from README for the main workflow.
- Capture screenshots separately for the submitted Word report if required.

## 8. Honest Limitations

- No real-time UIS integration.
- No advanced PDF/Excel report export.
- No global timetable optimization.
- Manual screenshot refresh is required for the final Word file.
- Some notification event types are available only when corresponding backend flows emit them.

## 9. Future Work

- UIS synchronization.
- Advanced dashboard and exports.
- More complete notification coverage.
- Automated end-to-end UI tests with Playwright.
