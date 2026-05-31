# W5-07 / Issue #50 Basic Reports Evidence

## Scope

Issue #50 adds a real basic report path for final submission:

- `GET /api/reports/basic`
- `/academic/reports`

Branch: `feature/basic-reports`

## API Contract

- `GET /api/reports/basic`
  - roles: CBDT, QTV
  - returns:
    - `schedule_summary`
    - `room_usage`
    - `issue_summary`
    - `room_block_summary`
    - `change_request_summary`
    - `feedback_summary`
    - `data_sources`

## Data Source Notes

- Scheduled/published/cancelled counts: `lab_schedule_entries`
- Room usage: `rooms` + `lab_schedule_entries`
- Issue counts: `room_issue_reports`
- Room block counts: `room_block_requests`
- Change/cancel counts: `lab_schedule_change_requests`
- Feedback counts: `student_feedback`

## Frontend Wiring

- `/academic/reports` now calls `GET /api/reports/basic`.
- The screen shows:
  - main metric cards
  - room usage table
  - data source table
- Advanced admin report dashboard/export remains out of scope and is documented in `docs/report/basic-report-scope.md`.

## Screenshot Note

Automated screenshots were not captured in this CLI run because browser automation is not installed. Manual screenshots for `/academic/reports` should be captured in #52 during the final demo package.

## Local Validation - 2026-05-31

Code checks:

- `node -c backend/src/modules/reports/report.service.js`
- `node -c backend/src/modules/reports/report.controller.js`
- `node -c backend/src/modules/reports/report.routes.js`
- `node -c backend/src/routes/index.js`
- backend `npm run lint`
- frontend `npm run lint`
  - passed with existing hook warnings outside #50.
- frontend `npm run build`
  - passed.
  - Next.js emitted an existing workspace-root warning because the repo has both root and frontend lockfiles.

API smoke:

- Backend: `http://localhost:4000/api`
- Demo accounts: `cbdt1`, `admin`, `sv1`

Result:

- CBDT `GET /api/reports/basic`: HTTP 200.
- QTV/Admin `GET /api/reports/basic`: HTTP 200.
- SV `GET /api/reports/basic`: HTTP 403.
- Returned summary from local data:
  - `total_scheduled`: `10`
  - `published`: `9`
  - `rooms`: `3`
  - `issues`: `0`
  - `change_requests`: `0`
  - `feedback`: `0`
  - `sources`: `6`

The smoke run was read-only and did not create database rows.
