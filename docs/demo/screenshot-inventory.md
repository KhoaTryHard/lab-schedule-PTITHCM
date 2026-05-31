# Screenshot Inventory

## Existing Screenshot Evidence

Core UI screenshots already in `docs/screenshots/`:

| File | Purpose |
| --- | --- |
| `01-login-qtv.png` | QTV login |
| `02-login-cbdt.png` | CBDT login |
| `03-login-gv.png` | GV login |
| `04-login-ktv.png` | KTV login |
| `05-login-sv.png` | SV login |
| `06-cbdt-create-request.png` | CBDT creates schedule request |
| `07-auto-arrange-result.png` | Auto-arrange result |
| `08-check-constraint-pass.png` | Constraint pass |
| `09-check-constraint-fail.png` | Constraint fail |
| `10-schedule-draft.png` | Draft schedule |
| `11-schedule-approved.png` | Approved schedule |
| `12-schedule-published.png` | Published schedule |
| `13-sv-my-schedule.png` | Student schedule lookup |
| `14-gv-my-schedule.png` | Lecturer schedule lookup |
| `15-ktv-room-schedule.png` | Technician room schedule |
| `16-postman-collection.png` | Postman collection |
| `17-postman-auto-arrange1.png` | Postman auto arrange evidence |
| `17-postman-auto-arrange2.png` | Postman auto arrange evidence |
| `18-postman-check-constraints-fail.png` | Postman constraint evidence |

Postman screenshots already in `docs/postman/screenshot/`:

- `image1.png` through `image24.png`.

## Screenshots To Refresh Manually For Final Word

The following are the highest-value screenshots to refresh after the final API/UI integration:

- `/academic/reports`
- `/lecturer/change-requests`
- `/academic/change-requests`
- `/lecturer/room-issues`
- `/technician/issues`
- `/student/feedback`
- `/student/notifications`
- `docs/postman/test-cases-final.md` or Postman runner result

## Refreshed QTV Screenshots

The following QTV screenshots were refreshed with Chrome DevTools MCP and saved in `docs/screenshots/final/`:

| File | Purpose |
| --- | --- |
| `01-qtv-accounts.png` | QTV account management with UTF-8 Vietnamese names and create/edit/lock actions |
| `02-qtv-reports.png` | QTV real basic report metrics from `GET /api/reports/basic` |
| `03-qtv-training-data.png` | QTV academic master data with `academic_weeks=22` and demo course `SHOT1001` |
| `04-qtv-devices.png` | QTV device CRUD view with demo device `SHOT-DEVICE-001` updated to `Lỗi nhẹ` |
| `05-qtv-software.png` | QTV software package CRUD view with demo package `Screenshot Demo Package` |
| `06-qtv-audit-logs.png` | QTV audit evidence for account status, device, software, and course actions |

The QTV screenshots used temporary `SHOT-*` demo rows. The database was reset after capture and verified back at `users=10`, `devices=4`, `software_packages=3`, `academic_weeks=22`, with generated Sprint 2 tables and audit logs at `0`.

The remaining non-QTV screenshot targets should still be refreshed manually if the final Word report needs a fully current role-by-role image set.
