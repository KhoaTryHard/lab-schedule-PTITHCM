# Final Demo Test Workflow

## Goal

Use this workflow before the final submission or live demo to verify the MVP from a clean database baseline through API smoke, frontend route checks, and manual UI screenshot evidence.

This workflow intentionally does not add Playwright or CI automation. UI validation is manual plus screenshots. API validation uses Postman evidence and the local smoke script.

## Roles

| Person | Responsibility |
| --- | --- |
| Khoa | Reset environment, run backend/API smoke, verify reports, collect final evidence |
| Duy | Cross-check TC01-TC25 and Postman/API evidence |
| Thanh | Walk through frontend role screens and refresh screenshots |

## 1. Preflight

- Confirm current branch is `develop` or a branch based on latest `develop`.
- Confirm `backend/.env` points to local MySQL database `lab_schedule_ptit_v2`.
- Confirm `frontend/.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`.
- Confirm MySQL client is available. On this machine it is available at:

```powershell
C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
```

- Check whether demo services are already running:

```powershell
Get-NetTCPConnection -LocalPort 3000,4000 -State Listen -ErrorAction SilentlyContinue
```

If old services are in an unknown state, stop them and restart after DB reset.

## 2. Reset Baseline

Reset database from the project dump and seed:

```powershell
.\scripts\reset-demo-db.ps1
```

The reset script preserves UTF-8 Vietnamese seed text. Avoid `Get-Content | mysql` in PowerShell; it can turn Vietnamese names into `???`.

Verify baseline counts:

| Table | Expected |
| --- | ---: |
| `users` | 10 |
| `rooms` | 3 |
| `lab_schedule_requests` | 7 |
| `lab_schedule_entries` | 8 |
| `lab_schedule_change_requests` | 0 |
| `room_issue_reports` | 0 |
| `room_block_requests` | 0 |
| `student_feedback` | 0 |
| `notifications` | 0 |

Start services:

```powershell
cd backend
npm start
```

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:4000/api/health
http://localhost:3000
```

## 3. Static And Automated Smoke

Run static checks:

```powershell
cd backend
npm run lint
```

```powershell
cd frontend
npm run lint
npm run build
```

Run the final demo smoke script from the repository root:

```powershell
.\scripts\final-demo-smoke.ps1
```

The script verifies:

- Health endpoint.
- Login success for `admin`, `cbdt1`, `gv_phthy`, `ktv1`, `sv1`.
- Wrong password returns HTTP 401.
- Room scope contains the three MVP rooms.
- Schedule request create/list.
- Constraint pass and failures for room conflict, lecturer conflict, capacity, software, holiday, and room block.
- Auto-arrange returns ranked options.
- Draft, approve, publish, SV/GV lookup lifecycle.
- Schedule change request create/review and RBAC.
- Room issue create/resolve.
- Room block create/review and constraint integration.
- Student feedback submit/respond and notification read/ack/read-all.
- Basic reports API and RBAC.
- Key frontend routes return HTTP 200.

The script creates temporary DB rows. Reset the database again after the test run if a pristine demo baseline is needed.

## 4. Manual UI Walkthrough And Screenshots

Use the demo accounts from `docs/demo/seed-reset.md`.

Capture or refresh these screenshots:

| Route or artifact | Owner | Pass criteria |
| --- | --- | --- |
| `/academic/reports` | Khoa | Metrics load from real `GET /api/reports/basic` |
| `/lecturer/change-requests` | Thanh | GV sees published schedule options and form submits to API |
| `/academic/change-requests` | Thanh | CBDT can list/review change requests |
| `/lecturer/room-issues` | Thanh | GV can report a room issue for a taught schedule |
| `/technician/issues` | Thanh | KTV can list room issues and submit block request |
| `/student/feedback` | Thanh | SV can select published schedule and submit feedback |
| `/student/notifications` | Thanh | SV notifications page renders and supports state changes when data exists |
| `docs/postman/test-cases-final.md` or Postman runner | Duy | TC01-TC25 evidence is visible |

Suggested screenshot location:

```text
docs/screenshots/final/
```

Suggested naming:

```text
01-academic-reports.png
02-lecturer-change-requests.png
03-academic-change-requests.png
04-lecturer-room-issues.png
05-technician-issues.png
06-student-feedback.png
07-student-notifications.png
08-postman-final-evidence.png
```

## 5. Evidence And Closeout

- Update or reference `docs/postman/test-cases-final.md` for TC01-TC25.
- Store the latest run summary in `docs/postman/test_results_final_demo.md`.
- Add final screenshots to the Word report package.
- Reset DB again before the actual live demo so generated test rows do not affect the walkthrough.

Pass criteria for final demo readiness:

- Backend health returns HTTP 200.
- All five demo accounts can log in.
- Static checks pass with no blocking errors.
- `scripts/final-demo-smoke.ps1` completes without assertion errors.
- Manual screenshots cover all high-value final screens.
- Known warnings or manual-only limitations are documented honestly.
