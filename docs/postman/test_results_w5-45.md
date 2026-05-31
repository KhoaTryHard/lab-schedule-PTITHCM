# W5-02 / Issue #45 Schedule Change Request Evidence

## Scope

Issue #45 adds real backend APIs for lecturer schedule change requests:

- reschedule
- makeup
- cancel

Branch: `feature/schedule-change-requests`

## API Contract

Base path: `/api/schedule-change-requests`

Lecturer:

- `GET /api/schedule-change-requests`
  - returns own visible change requests
- `GET /api/schedule-change-requests/:id`
  - returns one visible change request
- `POST /api/schedule-change-requests`
  - creates a submitted request for a schedule entry taught by the lecturer

CBDT/QTV:

- `GET /api/schedule-change-requests`
  - returns all requests
  - supports filters: `status`, `change_type`, `lab_schedule_entry_id`
- `GET /api/schedule-change-requests/:id`
- `PATCH /api/schedule-change-requests/:id/review`
  - body: `{ "request_status": "approved" | "rejected", "review_notes": "..." }`
- `PATCH /api/schedule-change-requests/:id/implement`
  - marks an approved request as implemented
  - reschedule: updates the original schedule entry
  - makeup: creates a new schedule entry copied from the original entry with proposed schedule fields
  - cancel: marks the original schedule entry as cancelled

## Important Behavior

- GV can only create requests for `lab_schedule_entries` where they are the lecturer.
- GV can create requests only for approved/published schedule entries.
- New requests are created with `request_status = submitted`.
- CBDT/QTV review moves submitted requests to `approved` or `rejected`.
- Rejected requests store review notes and do not mutate the schedule entry.
- Implement is allowed only after approval.
- Implement checks basic schedule blocks before mutating/creating entries:
  - room conflict
  - lecturer conflict
  - approved room block
  - blocked academic holiday

## Frontend Wiring Note

The existing mock pages can be wired without changing their main data shape:

- `/lecturer/change-requests`
  - already builds payload fields that match `POST /api/schedule-change-requests`
  - replace mock success with the new POST service call
- `/academic/change-requests`
  - mock row fields match the API response fields plus nested `schedule`
  - replace mock list with `GET /api/schedule-change-requests`
  - replace mock review actions with `PATCH /:id/review` and `PATCH /:id/implement`

Frontend integration remains tracked by #49.

## Local Smoke Result - 2026-05-31

Environment:

- Backend: `http://localhost:4000/api`
- Database: local MySQL from `backend/.env`
- Demo accounts: `gv_phthy`, `cbdt1`, `admin`, `sv1`

Result:

- Login passed for `gv_phthy`, `cbdt1`, `admin`, `sv1`.
- Baseline schedule entry `#1` was confirmed as `published`.
- GV created a `cancel` request for entry `#1`: HTTP 201.
- CBDT listed submitted change requests and saw the created request: HTTP 200.
- QTV rejected the cancel request with review notes: HTTP 200.
- Rejected flow preserved original entry `#1` status as `published`.
- GV created a `makeup` request for entry `#1`: HTTP 201.
- CBDT approved the makeup request: HTTP 200.
- CBDT implemented the approved makeup request: HTTP 200.
- Implemented makeup flow created a new schedule entry and moved the request to `implemented`.
- SV access to schedule-change requests returned HTTP 403.
- Smoke-created change requests and the makeup schedule entry were cleaned up after the run.

## Limitations

- Makeup implementation creates a new schedule entry but does not add a dedicated foreign key from the change request to the new entry because the current schema has no such column.
- Notifications are not emitted in #45; notification APIs are tracked separately by #47.
- UI screens are not wired in #45; frontend integration is tracked by #49.
