# Final Report Package

This Markdown file is the source outline for the final Word report. Copy the sections into the required Word template and attach screenshots from `docs/demo/screenshot-inventory.md`.

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
- Testing: Postman, local API smoke scripts
- Documentation: Markdown, screenshots, GitHub issues/PRs

## 3. Implemented Features

| Area | Status | Evidence |
| --- | --- | --- |
| Auth/RBAC | Done | TC01-TC06 |
| Schedule request | Done | TC07-TC08 |
| Constraint checks | Done | TC09-TC14 |
| Auto-arrange | Done | TC15-TC17 |
| Schedule lifecycle | Done | TC18-TC19 |
| Schedule change request | Done | TC20, `test_results_w5-45.md` |
| Room issue/block | Done | TC21-TC22, `test_results_w5-46.md` |
| Feedback/notifications | Done | TC23-TC24, `test_results_w5-47.md` |
| Frontend integration | Done | `test_results_w5-49.md` |
| Basic reports | Done | TC25, `test_results_w5-50.md` |

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

## 6. Testing Summary

Final status:

- TC01-TC25: documented as Pass.
- Final evidence: `docs/postman/test-cases-final.md`.
- Week 5 smoke evidence:
  - `docs/postman/test_results_w5-45.md`
  - `docs/postman/test_results_w5-46.md`
  - `docs/postman/test_results_w5-47.md`
  - `docs/postman/test_results_w5-49.md`
  - `docs/postman/test_results_w5-50.md`

## 7. Demo Package

- Script: `docs/demo/final-demo-script.md`
- Reset instructions: `docs/demo/seed-reset.md`
- Screenshot inventory: `docs/demo/screenshot-inventory.md`
- Basic report scope: `docs/report/basic-report-scope.md`

## 8. Honest Limitations

- No real-time UIS integration.
- No advanced PDF/Excel report export.
- No global timetable optimization.
- Manual screenshot refresh is required for the final Word file.
- Some notification event types are available only when corresponding backend flows emit them.

## 9. Future Work

- UIS synchronization.
- Advanced dashboard and exports.
- Audit logs for all critical changes.
- More complete notification coverage.
- Automated end-to-end UI tests with Playwright.
