# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lab scheduling MVP for 3 physical computer lab rooms at PTIT: **2B11, 2B21, 2B31**. Monorepo with separate Express backend (port 4000) and Next.js frontend (port 3000).

## Commands

**Backend** (from `backend/`):
```bash
npm run dev          # nodemon hot-reload
npm start            # production
```

**Frontend** (from `frontend/`):
```bash
npm run dev          # Next.js dev server (port 3000)
npm run build
npm run lint
```

**Database setup:**
```bash
mysql -u root -p lab_schedule_ptit_v2 < database/Dump20260428.sql
mysql -u root -p lab_schedule_ptit_v2 < database/seed_demo_final.sql   # full demo data (5 roles)
```

No test runner is configured yet (`npm test` is a placeholder).

## Architecture

### Backend: `backend/src/`

Route → Controller → Service → `pool.query()` (mysql2/promise). All handlers are wrapped with `asyncHandler` from `utils/asyncHandler.js`; do not omit this wrapper for async routes.

Standardized responses always go through `utils/apiResponse.js` (`ok`, `created`, `fail`).

**Modules in `src/modules/`:** auth, health, rooms, schedule-requests, schedules.

**Critical constraint in `src/config/roomScope.js`:** `ROOM_SCOPE = ['2B11', '2B21', '2B31']` is hardcoded. Every room query/validation must call `isInScopeRoom()` or apply this filter. This is enforced both at the service layer and at DB query level.

**Schedule status state machine** (enforced in `schedules/schedule.service.js`):
- `draft → approved` via `PATCH /schedules/:id/approve`
- `approved → published` via `PATCH /schedules/:id/publish`
- Both transitions: ACADEMIC_OFFICER or ADMIN only (`requireRoles` middleware)
- Backwards/skip transitions return 409 with `current_status`

**8 hard constraints** checked before any schedule creation (all live in `schedule.service.js`):
`ROOM_SCOPE`, `ROOM_STATUS`, `ROOM_BLOCKED`, `HOLIDAY_BLOCKED`, `ROOM_CONFLICT`, `LECTURER_CONFLICT`, `CAPACITY_OK`, `SOFTWARE_OK`

`checkScheduleConstraints()` returns per-constraint results. `createDraftSchedule()` re-runs checks and aborts if any fail.

`SCHEDULE_LIST_SELECT` (a multi-line SQL constant at the top of `schedule.service.js`) is the single source of truth for all schedule query field selection — reuse it in any new list queries.

`formatScheduleResponse(row)` normalizes a DB row to the API response shape (includes both `entry_status` and `status` aliases) — always pipe rows through this.

**`autoArrangeSchedule`** in `schedule.service.js` implements the real rule-based algorithm (ADR 0002): generate candidates (room × day × slot) → filter by all 8 hard constraints → score by 6 criteria → return top 3. Response shape is `{ auto_arrange_status, selected_option, ranked_options, failed_reasons }`.

### Frontend: `frontend/`

Next.js App Router. Routes are role-gated at the layout level — each role has its own `app/<role>/layout.jsx`. Role-to-route mapping is centralized in `lib/roleRoutes.js`.

API calls go through `lib/apiClient.js` (adds JWT auth header automatically). Token storage is in `lib/authStorage.js`. Service wrappers are in `services/` (one file per backend module).

### Roles

| Code | Name | Can see |
|------|------|---------|
| QTV | Admin | Everything |
| CBDT | Academic Officer | All statuses; creates/approves/publishes |
| GV | Lecturer | Own published schedules |
| KTV | Technician | Published room schedules |
| SV | Student | Own published lab schedules |

Role codes are in `backend/src/config/roles.js` (`ROLES` constant). Frontend has parallel constants in `lib/constants.js`.

## Environment Variables

Backend (`.env` from `backend/.env.example`):
```
DB_NAME=lab_schedule_ptit_v2
JWT_SECRET=change_me_in_local_env
APP_PORT=4000
```

Frontend (`.env.local` from `frontend/.env.example`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

## Key Documentation

- `docs/scope-mvp-v1.md` — Definitive scope: what is/isn't in MVP, room constraints, confirmed business rules
- `docs/api-contract/api-contract-v1.md` — Full REST API spec; update this when adding/changing endpoints
- `docs/postman/LabSchedulePTIT.postman_collection.json` — Postman collection; add test items when adding endpoints
- `docs/git-workflow.md` — Commit format, branch strategy, PR process

## Git Conventions

Commit format: `<type>: <short description>` — types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

Target branch for PRs: `develop` (not `main`). `main` is for stable submissions only.

---

## Project Status

### Đã hoàn thành

| Issue | Task | Branch / PR | Commit |
|-------|------|-------------|--------|
| #15 W3-05 | Academic schedule request UI (list + create modal, 7 status tabs, role guard QTV/CBDT) | PR #25 `feature/thanh-integrate-frontend` -> `develop` | `9431a26` merge |
| #16 W3-06 | Constraint checking result UI (form + 8 constraint rules PASS/FAIL, create button gated on all-PASS) | PR #25 `feature/thanh-integrate-frontend` -> `develop` | `9431a26` merge |
| #17 W3-07 | Schedule lookup UI by role (ScheduleLookupTable reusable component, pages cho GV/KTV/SV) | PR #25 `feature/thanh-integrate-frontend` -> `develop` | `9431a26` merge |
| #17 W3-07 | Backend: `student_user_id` filter cho `GET /api/schedules` | PR #25 `feature/thanh-integrate-frontend` -> `develop` | `9431a26` merge |
| #23 W3-04 | Approve/publish schedule API (`PATCH /schedules/:id/approve`, `PATCH /schedules/:id/publish`) | PR #23 / `develop` | `bad8eae`, `cf4ff47` |
| #22 | `end_date` cross-field validation cho schedule-request | PR #22 / `develop` | `102f155` |
| #26 W4-01 | Clean mojibake encoding in schedules module; standardize schedule validator/service messages to English | PR #38 `fix/w4-01-clean-mojibake-schedules` -> `develop` | `cc273e4` merge, `27854d6` fix |
| #31 W4-05 | Hide/stub 6 admin-academic pages without backend API (accounts, lookups, reports, settings, trainingData×2) | PR #39 `feature/thanh-integrate-frontend` -> `develop` | `a4c0482` merge |
| #32 W4-06 | Polish UI states on 6 main demo pages (LoadingState, ErrorState, EmptyState via UiState.jsx + DataTable) | PR #39 `feature/thanh-integrate-frontend` -> `develop` | `a4c0482` merge |
| #35 W4-09 | Auto-arrange page frontend: form (7 fields) + ranked options table (score badge, reasons modal) + "Chọn lịch này" button with confirmation | PR #39 `feature/thanh-integrate-frontend` -> `develop` | `a4c0482` merge |
| #27 W4-02 | `database/seed_demo_final.sql` — full demo data cho 5 roles (10 users, 3 rooms, 6 sections, 8 schedule entries, 7 requests covering all status tabs) | `develop` | `c612389` |
| #28 W4-03 | Confirm + implement auto-arrange Option B: real rule-based algorithm in `schedule.service.js`; fix `checkHolidayBlocked` day_of_week formula bug | `develop` | `2b79033` |
| #34 W4-08 | Replace `autoArrangeScheduleStub` with `autoArrangeSchedule` (async, real DB queries, scoring 6 criteria, top 3 options) | `develop` | `2b79033` |

### Trạng thái hiện tại

| Phần | Trạng thái | Ghi chú |
|------|-----------|---------|
| Backend API W3 | ✅ Hoàn chỉnh | Schedule request, constraint check, create draft, approve, publish, lookup schedules đã có trên `develop` |
| Schedules encoding/messages | ✅ Hoàn chỉnh | #26 đã merge; messages dùng English-only |
| Frontend pages (CBDT) | ✅ Hoàn chỉnh | `academic/schedule-requests`, `academic/auto-arrange` (form + ranked options + use button) |
| Frontend pages (GV/KTV/SV) | ✅ Hoàn chỉnh | `lecturer/my-schedule`, `technician/room-schedule`, `student/my-schedule` |
| `ScheduleLookupTable` component | ✅ Hoàn chỉnh | `frontend/components/schedules/ScheduleLookupTable.jsx` |
| UI states (loading/error/empty) | ✅ Hoàn chỉnh | 6 trang demo chính dùng `UiState.jsx` + `DataTable.jsx` |
| Pages không có backend API | ✅ Stubbed + hidden | 6 trang: admin/(accounts, lookups, reports, settings, trainingData), academic/trainingData |
| Auto-arrange backend | ✅ Hoàn chỉnh | `autoArrangeSchedule` real rule-based: generate candidates → filter 8 constraints → score → top 3; `HOLIDAY_BLOCKED` formula bug cũng đã sửa |
| Demo seed data | ✅ Hoàn chỉnh | `database/seed_demo_final.sql` — 10 users, 8 entries, 7 requests; chạy bằng `mysql -u root -p lab_schedule_ptit_v2 < database/seed_demo_final.sql` |
| Final Postman evidence | ❌ Chưa hoàn chỉnh | #30 W4-04 đang open, sẽ đóng #18 W3-08 |
| PR #39 | ✅ **Đã merge** | `feature/thanh-integrate-frontend` -> `develop`, merge commit `a4c0482` |
| #28 + #34 commit | ✅ **Đã push** | `autoArrangeSchedule` real algorithm + HOLIDAY_BLOCKED fix + CLAUDE.md — commit `2b79033` trên `develop` |

### Bước tiếp theo

1. **#30 W4-04** (task duy nhất còn lại): final Postman collection với ≥20 requests bao phủ toàn bộ API — đóng cả #18 W3-08.
   - Tham khảo `docs/api-contract/api-contract-v1.md` để biết đầy đủ endpoints.
   - Collection hiện tại: `docs/postman/LabSchedulePTIT.postman_collection.json`.
   - Assertions nên dùng `code`, `passed`, `status`, `entry_status` thay vì match exact message string (xem quyết định quan trọng bên dưới).

### Ghi chú repo hiện tại

- Current HEAD trên `develop`: `2b79033` — real auto-arrange algorithm + HOLIDAY_BLOCKED bugfix + CLAUDE.md
- Working tree: **sạch** (không còn file untracked hay modified)
- Demo accounts (password `123456`): `admin` (QTV), `cbdt1` (CBDT), `gv_ntbnguyen` (GV), `ktv1` (KTV), `sv1` (SV)

### Quyết định quan trọng

**Schedule API messages dùng English-only trong code backend** (`schedule.routes.js`, `schedule.service.js`):
- #26 chọn chuẩn hóa sang English thay vì tiếng Việt có dấu để giảm rủi ro mojibake trong demo/API response.
- Chỉ đổi user-facing messages; không đổi field, enum, status code, constraint `code`, SQL, hoặc response shape.

**Postman assertions không phụ thuộc exact human-readable message**:
- Sau #26, các test schedule nên ưu tiên assert `code`, `passed`, `status`, `entry_status`, `current_status` thay vì substring tiếng Anh/tiếng Việt.
- Lý do: message là text hiển thị, dễ thay đổi khi chuẩn hóa ngôn ngữ; `code` và trạng thái nghiệp vụ mới là contract ổn định.

**Subquery thay vì JOIN cho `student_user_id` filter** (`schedule.service.js`):
- Query base đã có `JOIN practice_teams pt`. Thêm `JOIN practice_team_members` vào base query sẽ nhân bản mỗi schedule entry theo số SV trong nhóm → kết quả sai khi không dùng filter.
- Dùng subquery `IN (SELECT practice_team_id FROM practice_team_members WHERE student_user_id = ?)` chỉ kích hoạt khi filter được truyền vào, không ảnh hưởng các query khác.

**`ScheduleLookupTable` là component tái sử dụng duy nhất cho tất cả roles**:
- GV, KTV, SV đều có trang xem lịch riêng nhưng dùng chung 1 component với `fixedParams` và `currentUserIdParamName` props để scope dữ liệu theo role.
- Tránh duplicate logic pagination/filter ở 3+ nơi.

**`SCHEDULE_LIST_SELECT` là nguồn thật duy nhất cho SELECT fields**:
- Constant SQL ở đầu `schedule.service.js`, reuse trong mọi query lấy danh sách lịch. Không tự ý thêm field ở từng query riêng lẻ.

**`formatScheduleResponse(row)` bắt buộc cho mọi DB row trả về**:
- Normalize shape, alias `entry_status` → `status` để frontend không phụ thuộc vào tên cột DB.

**6 trang stubbed (không phải 7 như issue #31 ghi)**:
- Tìm được 6 file stub thực tế: `admin/(accounts, lookups, reports, settings, trainingData)`, `academic/trainingData`.
- Cơ chế ẩn: không đưa route vào `navItems` trong `lib/roleConfig.js`; page file vẫn tồn tại nhưng hiển thị `EmptyState` "Sprint 2" nếu truy cập trực tiếp qua URL.

**`seed_demo_final.sql` dùng MySQL user variable cho bcrypt hash**:
- `SET @pwd = '$2a$10$...'` ở đầu file, tất cả INSERT users đều dùng `@pwd` thay vì lặp lại hash 77 ký tự.
- Hash được pre-compute bằng `node -e "const b=require('bcryptjs');console.log(b.hashSync('123456',10));"` trong `backend/` rồi paste vào SQL — không thể hash trong SQL thuần.
- Lý do chọn `.sql` (không phải `.js`): issue yêu cầu, dễ chạy với `mysql` client, dễ version-control.

**`sv1` chỉ thấy entry 5, không thấy entry 7 (dù cùng INT1332/01)**:
- `sv1` (user_id=10) chỉ là thành viên của `practice_team 5` (INT1332/01 tổ 1), không phải `practice_team 7` (INT1332/01 tổ 2).
- Backend lọc theo `practice_team_members.student_user_id` — SV chỉ thấy lịch của tổ mình.
- Entry 5 và 7 đều có cùng lecturer (gv_ntbnguyen) và room (2B31) nhưng khác ngày (Oct 1 vs Sep 17).

**Entry 3 giữ `draft` vì Labor Day (2026-05-01)**:
- `calendar_holidays` có holiday id=2 cho ngày 1/5/2026 với `is_lab_scheduling_blocked=1`.
- Nếu tạo entry với status `published`/`approved`, HOLIDAY_BLOCKED constraint sẽ reject khi re-check.
- Để `draft` vừa hợp lệ về DB, vừa minh họa đúng business rule cho demo.

**`autoArrangeSchedule` — real rule-based algorithm (#28 + #34)**:
- Generate candidates: ROOM_SCOPE × preferred_day (hoặc weekdays 2-6) × preferred_slot (hoặc ['1-4','7-10'])
- Filter: mỗi candidate chạy `checkScheduleConstraints` tuần tự; collect unique failed constraint codes vào `failed_reasons`
- Score: +30 preferred day+slot, +25 software (constant), +15 capacity fit, +15 few entries, +10 course room history, +5/+3/+1 tiebreaker
- Return top 3 sorted by score; `auto_arrange_status: 'no_options'` nếu không có candidate nào pass constraints
- Frontend auto-arrange không cần sửa — nhận cùng response shape như stub

**`checkHolidayBlocked` — sửa công thức day_of_week (#28 bugfix)**:
- Bug cũ: `WEEKDAY(holiday_date) = dayOfWeek - 1` — sai vì day_of_week encoding thực tế là 1=Sun,2=Mon,...,7=Sat nhưng MySQL WEEKDAY() là 0=Mon,...,6=Sun
- Fix: `WEEKDAY(holiday_date) = (dayOfWeek + 5) % 7`
  - Mon(2): (2+5)%7=0 ✓, Fri(6): (6+5)%7=4 ✓, Sun(1): (1+5)%7=6 ✓
- Bug này ảnh hưởng cả `createDraftSchedule` nên fix cũng bảo vệ constraint thật khi tạo lịch thủ công.
