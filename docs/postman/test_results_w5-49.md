# W5-06 / Issue #49 Frontend Sprint 2 Integration Evidence

## Scope

Issue #49 wires frontend mock/demo paths to the real Sprint 2 backend APIs:

- schedule change requests from #45
- room issues and room block requests from #46
- student feedback and notifications from #47

Branch: `feature/frontend-sprint2-integration`

## Screens Wired To Real APIs

Schedule change requests:

- `/lecturer/change-requests`
  - loads lecturer published schedules.
  - submits real `POST /api/schedule-change-requests`.
- `/academic/change-requests`
  - loads real `GET /api/schedule-change-requests`.
  - calls real review/implement APIs:
    - `PATCH /api/schedule-change-requests/:id/review`
    - `PATCH /api/schedule-change-requests/:id/implement`

Room operations:

- `/lecturer/room-issues`
  - loads real `GET /api/room-issues`.
  - submits real `POST /api/room-issues`.
- `/technician/issues`
  - loads real `GET /api/room-issues`.
  - submits real `POST /api/room-block-requests`.

Student feedback:

- `/student/feedback`
  - loads real `GET /api/student-feedback`.
  - submits real `POST /api/student-feedback`.
  - keeps `contact_info` optional, aligned with the backend contract.

Notifications:

- `/student/notifications`
- `/academic/notifications`
- `/lecturer/notifications`
- `/technician/notifications`

All notification pages now use:

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/:id/acknowledge`
- `PATCH /api/notifications/read-all`

## Local Validation - 2026-05-31

Frontend:

- `npm run lint` passed.
  - Remaining warnings are existing hook warnings outside #49:
    - `academic/auto-arrange/page.jsx`
    - `academic/schedule-requests/page.jsx`
    - `admin/rooms/page.jsx`
    - `components/common/DataTable.jsx`
    - `components/schedules/ScheduleLookupTable.jsx`
- `npm run build` passed.
  - Next.js generated all role routes successfully.

Backend API smoke for connected UI endpoints:

- Backend: `http://localhost:4000/api`
- Demo accounts: `gv_phthy`, `cbdt1`, `sv1`, `ktv1`
- Smoke was read-only and did not create database rows.

Result counts returned by role:

- `gv:/schedule-change-requests` -> `0`
- `gv:/room-issues` -> `0`
- `gv:/notifications` -> `1`
- `cbdt:/schedule-change-requests` -> `0`
- `cbdt:/student-feedback` -> `0`
- `cbdt:/room-block-requests` -> `1`
- `cbdt:/notifications` -> `0`
- `sv:/student-feedback` -> `0`
- `sv:/notifications` -> `1`
- `ktv:/room-issues` -> `0`
- `ktv:/room-block-requests` -> `1`
- `ktv:/notifications` -> `1`

## Screenshot Note

Automated screenshots were not captured in this CLI run because the frontend project does not include a browser automation dependency such as Playwright, and the available validation path was lint/build plus API smoke. Manual reviewer screenshots should be captured from the wired routes above during the demo pass.

## Limitations

- #49 wires existing screens to backend APIs; it does not add a dedicated CBDT feedback management screen beyond notifications.
- Some notification categories for GV/KTV may be empty until backend emits more event types. The pages still call the real current-user notification APIs.
- Route-level visual smoke in a logged-in browser remains a manual demo step.
