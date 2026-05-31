# W5-03 / Issue #46 Room Issue And Room Block Evidence

## Scope

Issue #46 adds real backend APIs for:

- room issue reports (`room_issue_reports`)
- room block requests (`room_block_requests`)

Branch: `feature/room-issues-blocks`

## API Contract

Room issue reports:

- `GET /api/room-issues`
  - roles: GV, KTV, CBDT, QTV
  - filters: `status`, `issue_type`, `room_code`, `lab_schedule_entry_id`
  - GV sees own reported issues; KTV/CBDT/QTV can list all visible reports.
- `POST /api/room-issues`
  - roles: GV, KTV
  - creates a `new` issue report tied to room and reporter.
  - GV reports must include `lab_schedule_entry_id` and must refer to a schedule they teach.
  - KTV can report by `room_id` or `room_code`.
- `PATCH /api/room-issues/:id`
  - roles: KTV, CBDT, QTV
  - supports status, assignee, and resolution notes updates.

Room block requests:

- `GET /api/room-block-requests`
  - roles: KTV, CBDT, QTV
  - filters: `status`, `block_type`, `room_code`
- `POST /api/room-block-requests`
  - roles: KTV, CBDT, QTV
  - creates a submitted block request with room, date range, optional day/time-slot, type, title, and reason.
- `PATCH /api/room-block-requests/:id/review`
  - roles: CBDT, QTV
  - body: `{ "block_status": "approved" | "rejected", "review_notes": "..." }`

## Important Behavior

- Room scope stays aligned with MVP rooms:
  - `2B11`
  - `2B21`
  - `2B31`
- Room block requests use the existing schema and status values.
- Approved block requests are immediately visible to existing schedule constraint checks because those checks already read `room_block_requests` with `block_status = 'approved'`.
- No schema migration is required.

## Frontend Wiring Note

The existing mock pages can be wired without changing the main form shape:

- `/lecturer/room-issues`
  - replace local mock submit with `POST /api/room-issues`
  - use `lab_schedule_entry_id` from the selected schedule; backend derives the room
- `/technician/issues`
  - replace mock issue list with `GET /api/room-issues`
  - replace mock block-request submit with `POST /api/room-block-requests`
  - review actions can use `PATCH /api/room-block-requests/:id/review` for CBDT/QTV views

Frontend integration remains tracked by #49.

## Local Smoke Result - 2026-05-31

Environment:

- Backend: `http://localhost:4000/api`
- Database: local MySQL from `backend/.env`
- Demo accounts: `gv_phthy`, `ktv1`, `cbdt1`, `sv1`

Result:

- Login passed for `gv_phthy`, `ktv1`, `cbdt1`, `sv1`.
- GV created a room issue report for schedule entry `#1`: HTTP 201.
- Created issue was tied to the schedule room `2B31` and the GV reporter.
- KTV listed new room issues and saw the created report: HTTP 200.
- KTV resolved the issue with assignee and resolution notes: HTTP 200.
- KTV created a submitted room block request for `2B11`: HTTP 201.
- CBDT listed submitted room block requests and saw the created request: HTTP 200.
- SV access to room block requests returned HTTP 403.
- CBDT approved the room block request: HTTP 200.
- Existing `POST /api/schedules/check-constraints` saw the approved block through the `ROOM_BLOCKED` rule.
- Smoke-created issue and block request rows were cleaned up after the run.

## Limitations

- Room issue notifications are not emitted in #46; notification APIs are tracked separately by #47.
- Room block approval does not mutate existing published schedules. It only creates approved block data for future scheduling checks.
- UI screens are not wired in #46; frontend integration is tracked by #49.
