# W5-05 / Issue #48 Admin Master Data Evidence

## Scope

Issue #48 adds real backend APIs for selected admin/master-data groups and wires
the main admin screens to read from MySQL instead of static mock data.

Branch: `feature/admin-master-data`

## API Groups

Accounts, QTV only:

- `GET /api/admin/accounts`
- `POST /api/admin/accounts`
- `PATCH /api/admin/accounts/:id`
- `PATCH /api/admin/accounts/:id/disable`

Master data, QTV/CBDT:

- `GET /api/admin/master-data/semesters`
- `GET /api/admin/master-data/academic-weeks`
- `GET /api/admin/master-data/time-slots`
- `GET /api/admin/master-data/courses`
- `GET /api/admin/master-data/course-sections`
- `GET /api/admin/master-data/student-cohorts`
- `GET /api/admin/master-data/lecturer-assignments`

Writable master-data resources in #48:

- `semesters`
- `academic-weeks`
- `time-slots`
- `courses`
- `student-cohorts`

Read-only master-data resources in #48:

- `course-sections`
- `lecturer-assignments`

Devices/software:

- `GET /api/admin/devices`
- `POST /api/admin/devices`
- `PATCH /api/admin/devices/:id`
- `GET /api/admin/software-packages`
- `POST /api/admin/software-packages`
- `PATCH /api/admin/software-packages/:id`

## UI Evidence Targets

- `/admin/accounts` loads account rows from `GET /api/admin/accounts`.
- `/admin/trainingData` loads tab data from `GET /api/admin/master-data/:resource`.
- `/academic/trainingData` reuses the same real master-data API for CBDT.

## Role Guard Expectations

- QTV can read/write accounts.
- CBDT cannot read/write accounts.
- QTV/CBDT can read master data and write the writable resources listed above.
- QTV/CBDT/KTV can read devices and software packages.
- GV/SV should receive `403` for admin APIs.

## Local Smoke Result - 2026-05-31

Environment:

- Backend: `http://localhost:4000/api`
- Database: local MySQL from `backend/.env`
- Demo accounts: `admin`, `cbdt1`, `ktv1`, `sv1`

Result:

- Login passed for `admin`, `cbdt1`, `ktv1`, `sv1`.
- Admin accounts list/create/update/disable passed.
- CBDT account access correctly returned `403`.
- CBDT master-data list passed for all seven resources.
- `course-sections` create correctly returned `405` because it is read-only in #48.
- Create/update passed for `semesters`, `academic-weeks`, `time-slots`, `courses`,
  and `student-cohorts`.
- KTV device/software read passed.
- KTV device create correctly returned `403`.
- Admin device create/update passed.
- Admin software package create/update passed.
- SV master-data access correctly returned `403`.
- Smoke-created rows were cleaned up from the local database after the run.

## Notes

- No database migration is required for #48.
- No hard delete endpoint is exposed for users; account disable sets
  `account_status = inactive`.
- Excel upload/import remains out of scope for #48.
