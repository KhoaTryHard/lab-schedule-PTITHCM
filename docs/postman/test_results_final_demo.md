# Final Demo Test Workflow Evidence

## Environment

- Date: 2026-05-31 16:01 +07:00
- Branch: `develop`
- Backend: `http://localhost:4000/api`
- Frontend: `http://localhost:3000`
- Database: local MySQL `lab_schedule_ptit_v2`
- Seed source:
  - `database/Dump20260428.sql`
  - `database/seed_demo_final.sql`

## Preflight And Reset

Baseline reset completed before the test run.

| Table | Expected | Verified |
| --- | ---: | ---: |
| `users` | 10 | 10 |
| `rooms` | 3 | 3 |
| `devices` | 4 | 4 |
| `software_packages` | 3 | 3 |
| `academic_weeks` | 22 | 22 |
| `lab_schedule_requests` | 7 | 7 |
| `lab_schedule_entries` | 8 | 8 |
| `lab_schedule_change_requests` | 0 | 0 |
| `room_issue_reports` | 0 | 0 |
| `room_block_requests` | 0 | 0 |
| `student_feedback` | 0 | 0 |
| `notifications` | 0 | 0 |
| `workflow_audit_logs` | 0 | 0 |

After the smoke run and after the QTV screenshot refresh, the database was reset again and the same baseline counts were verified. Temporary screenshot rows (`SHOT-*`, `Screenshot Demo Package`) were removed. This keeps the local demo environment clean.

## Static And Build Checks

| Check | Result | Notes |
| --- | --- | --- |
| Backend `npm run lint` | Pass | Placeholder lint command completed |
| Frontend `npm run lint` | Pass with warnings | Existing React hook warnings only; 0 errors |
| Frontend `npm run build` | Pass with warning | Next.js workspace-root warning due multiple lockfiles; build completed |

## Automated Smoke Script

Command:

```powershell
.\scripts\final-demo-smoke.ps1
```

Generated local JSON evidence:

- `docs/postman/final_demo_api_smoke_results.json`
- `docs/postman/final_demo_created_ids.json`

Temporary IDs created during the run:

| Entity | ID |
| --- | ---: |
| Account | 11 |
| Software package | 4 |
| Device | 137 |
| Semester | 3 |
| Course | 5 |
| Course section | 7 |
| Schedule request | 8 |
| Schedule entry | 9 |
| Schedule change request | 1 |
| Room issue | 1 |
| Room block request | 1 |
| Student feedback | 1 |

These rows were removed by the post-run DB reset.

## Smoke Results

| Area | Result | Details |
| --- | --- | --- |
| Health | Pass | `GET /api/health` HTTP 200 |
| Login QTV | Pass | `admin` role `QTV` |
| Login CBDT | Pass | `cbdt1` role `CBDT` |
| Login GV | Pass | `gv_phthy` role `GV` |
| Login KTV | Pass | `ktv1` role `KTV` |
| Login SV | Pass | `sv1` role `SV` |
| Wrong password | Pass | HTTP 401 |
| Room scope | Pass | `2B11`, `2B21`, `2B31` |
| Admin account CRUD | Pass | QTV create/update/disable |
| Admin software CRUD | Pass | QTV create/update |
| Admin device CRUD | Pass | QTV create/update |
| Academic master CRUD | Pass | Semester/course/course-section create/update |
| Audit log | Pass | `workflow_audit_logs` contained 2 logs for smoke course-section CRUD |
| Schedule request | Pass | CBDT create/list |
| Constraint pass | Pass | Valid slot passed all rules |
| Auto-arrange | Pass | Returned 2 ranked options |
| Draft lifecycle | Pass | Create draft, approve, publish |
| Role lookup | Pass | SV/GV saw the published smoke schedule |
| Conflict checks | Pass | `ROOM_CONFLICT`, `LECTURER_CONFLICT` detected |
| Capacity check | Pass | `CAPACITY_OK=false` for team `999` |
| Software check | Pass | `SOFTWARE_OK=false` for room `2B31` + software `1` |
| Software mapping check | Pass | `SOFTWARE_OK` derives mapped packages when client omits `required_software_ids` |
| Holiday check | Pass | `HOLIDAY_BLOCKED=false` on `2026-05-01` |
| SV forced scope | Pass | Unscoped lookup returns published schedules for the current student only |
| Schedule filters | Pass | `semester_id`, `course_section_id`, `week_no` reject non-matching values |
| Schedule change | Pass | GV create, CBDT reject, SV forbidden |
| Room issue | Pass | GV create, KTV resolve |
| Room block | Pass | KTV create, CBDT approve, `ROOM_BLOCKED` detected |
| Feedback | Pass | SV submit, CBDT respond, KTV forbidden |
| Notifications | Pass | CBDT read, SV acknowledge, SV read-all |
| Basic reports | Pass | CBDT/QTV HTTP 200, SV HTTP 403, device summary present |

## Frontend Route Smoke

All checked routes returned HTTP 200:

- `/login`
- `/academic/schedule-requests`
- `/academic/auto-arrange`
- `/academic/schedules`
- `/academic/change-requests`
- `/academic/reports`
- `/lecturer/my-schedule`
- `/lecturer/change-requests`
- `/lecturer/room-issues`
- `/student/my-schedule`
- `/student/feedback`
- `/student/notifications`
- `/technician/issues`
- `/technician/notifications`
- `/admin/accounts`
- `/admin/trainingData`
- `/admin/devices`
- `/admin/software`
- `/admin/audit-logs`
- `/admin/reports`

## Manual Screenshot Work Remaining

Automated screenshot capture is still intentionally out of scope. Refresh screenshots manually for the final Word report using `docs/test-workflow-final.md` and `docs/demo/screenshot-inventory.md`.

Chrome DevTools MCP walkthrough completed for QTV:

- `/admin/accounts`: UTF-8 names render correctly with no `???`; create/edit/lock actions are visible.
- `/admin/reports`: real report metrics and device summary render from `GET /api/reports/basic`.
- `/admin/devices`: create and update status verified through the UI.
- `/admin/software`: create verified through the UI.
- `/admin/trainingData`: course create verified through the UI; active semester renders `22` weeks and local dates without UTC day shift.
- `/admin/audit-logs`: device and software workflow logs rendered with actor and status transition details.

QTV screenshots refreshed with Chrome DevTools MCP:

| File | Evidence |
| --- | --- |
| `docs/screenshots/final/01-qtv-accounts.png` | Account list, UTF-8 names, create/edit/lock actions |
| `docs/screenshots/final/02-qtv-reports.png` | Real QTV report metrics and device summary |
| `docs/screenshots/final/03-qtv-training-data.png` | Master data with `academic_weeks=22` and demo course row |
| `docs/screenshots/final/04-qtv-devices.png` | Device CRUD view with `SHOT-DEVICE-001` |
| `docs/screenshots/final/05-qtv-software.png` | Software CRUD view with `Screenshot Demo Package` |
| `docs/screenshots/final/06-qtv-audit-logs.png` | Audit log evidence for user/device/software/course actions |
