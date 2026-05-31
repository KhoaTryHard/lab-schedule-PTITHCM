# Final Demo Script - 7 to 10 Minutes

## Roles

- Khoa: project scope, architecture, backend/API integration, final wrap-up.
- Duy: Postman/test evidence, constraints, API validation.
- Thanh: frontend walkthrough, role-based UI flows.

## Setup Before Demo

1. Reset database using `docs/demo/seed-reset.md`.
2. Start backend:

```powershell
cd backend
npm start
```

3. Start frontend:

```powershell
cd frontend
npm run dev
```

4. Open:

```text
http://localhost:3000
http://localhost:4000/api/health
```

## Main Demo Flow

### 0:00-1:00 - Khoa: Problem And Scope

- Topic: Lab Schedule PTIT, managing practical lab schedules for computer rooms.
- MVP scope: rooms `2B11`, `2B21`, `2B31`.
- Roles: QTV, CBDT, GV, KTV, SV.
- Key promise: CBDT creates scheduling requests, system checks constraints, schedules are approved/published, users see role-specific data.

### 1:00-2:30 - Thanh: Login And Role Navigation

- Login as CBDT: `cbdt1` / `123456`.
- Show sidebar and role-specific pages.
- Mention RBAC: unsupported roles are blocked by backend and frontend guards.

### 2:30-4:30 - Thanh: Scheduling Core

- Show schedule request page.
- Show auto-arrange page.
- Explain hard constraints:
  - room scope
  - room status
  - room conflict
  - lecturer conflict
  - capacity
  - software
  - holiday
  - room block
- Show schedule list and publish/lookup path if seeded data is ready.

### 4:30-6:00 - Khoa: Sprint 2 Integration

- Lecturer change request screen: `/lecturer/change-requests`.
- Academic change request review screen: `/academic/change-requests`.
- Lecturer room issue screen: `/lecturer/room-issues`.
- Technician room issue/block screen: `/technician/issues`.
- Student feedback screen: `/student/feedback`.
- Notifications screen for current user.

Use fallback if live data is sparse:

- Open evidence files:
  - `docs/postman/test_results_w5-45.md`
  - `docs/postman/test_results_w5-46.md`
  - `docs/postman/test_results_w5-47.md`
  - `docs/postman/test_results_w5-49.md`

### 6:00-7:30 - Duy: API/Test Evidence

- Open `docs/postman/test-cases-final.md`.
- State TC01-TC25 final status.
- Show Postman collection/environment files:
  - `docs/postman/LabSchedulePTIT.postman_collection.json`
  - `docs/postman/LabSchedulePTIT.local.postman_environment.json`
- Mention Week 5 endpoints are documented by local smoke evidence.

### 7:30-8:30 - Khoa: Reports

- Login as CBDT/QTV.
- Open `/academic/reports`.
- Show the real basic report metrics:
  - scheduled sessions
  - published sessions
  - room usage
  - issue count
  - change/cancel count
  - feedback count
- Evidence: `docs/postman/test_results_w5-50.md`.

### 8:30-10:00 - Khoa: Wrap-Up

- Completed:
  - auth/RBAC
  - schedule request
  - constraint checking
  - auto arrange
  - approve/publish
  - role lookup
  - admin/master data
  - change requests
  - room issues/blocks
  - feedback/notifications
  - basic reports
  - final evidence
- Honest limitations:
  - no real UIS sync
  - no advanced export/dashboard
  - screenshot refresh is manual in the final Word package
  - optimization is rule-based, not global timetable optimization

## Fallback Demo Path

If live frontend data is not stable:

1. Show backend health.
2. Show final TC status: `docs/postman/test-cases-final.md`.
3. Show W5 evidence files for #45-#50.
4. Show existing screenshot inventory: `docs/demo/screenshot-inventory.md`.
5. Show report scope: `docs/report/final-report-package.md`.
