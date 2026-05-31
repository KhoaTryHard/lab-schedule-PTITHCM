# Lab Schedule PTIT - MVP phân công lịch thực hành phòng máy

**Trưởng nhóm:** Nguyễn Đăng Khoa  
**Ngày khởi tạo repo:** 28/04/2026  
**Phạm vi MVP:** quản lý và tự động sắp xếp lịch thực hành cho 3 phòng máy `2B11`, `2B21`, `2B31`.

Repo này dùng mô hình **monorepo** để nộp đồ án và demo dễ hơn:

```text
lab-schedule-ptit/
  frontend/   # Next.js UI
  backend/    # Express.js API
  database/   # SQL dump, migrations, seeds
  docs/       # scope, report, diagrams, screenshots, postman, workflow
```

## 1. Luồng nghiệp vụ chính

```text
CBDT tạo yêu cầu xếp lịch thực hành
→ hệ thống lấy danh sách phòng in-scope: 2B11/2B21/2B31
→ thuật toán tự động sinh phương án xếp phòng thực hành theo tuần/ngày/ca hợp lệ
→ hệ thống kiểm tra ràng buộc cứng cho từng phương án
→ hệ thống chọn phương án tốt nhất hoặc trả danh sách phương án xếp hạng
→ CBDT xem preview phương án tự động và xác nhận tạo lịch thực hành draft
→ duyệt lịch
→ công bố lịch
→ GV/SV/KTV tra cứu lịch đã công bố
```

## 2. Công nghệ chốt

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React |
| Backend | Node.js, Express.js |
| Database | MySQL |
| API test | Postman |
| Quản lý source | GitHub, Git branch workflow |
| Tài liệu | Markdown, Word báo cáo môn học |

## 3. Cài đặt nhanh local

### 3.1 Database

Tạo database trong MySQL:

```sql
CREATE DATABASE lab_schedule_ptit_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import schema:

```powershell
.\scripts\reset-demo-db.ps1
```

Script này import `Dump20260428.sql` và `seed_demo_final.sql` bằng MySQL `SOURCE` với UTF-8. Không import qua `Get-Content | mysql` trong PowerShell vì cách đó có thể làm hỏng tiếng Việt thành `???`.

Nếu dùng MySQL Workbench hoặc XAMPP phpMyAdmin, mở file:

```text
database/Dump20260428.sql
database/seed_demo_final.sql
```

và chạy toàn bộ script theo đúng thứ tự.

### 3.2 Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend mặc định chạy ở:

```text
http://localhost:4000/api
```

Health check:

```text
GET http://localhost:4000/api/health
```

### 3.3 Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend mặc định chạy ở:

```text
http://localhost:3000
```

## 4. Tài khoản demo

Sau khi import schema và chạy `seed_demo_final.sql`:

| Vai trò | Username | Password |
|---|---|---|
| QTV (Admin) | admin | 123456 |
| CBDT (Giáo vụ) | cbdt1 | 123456 |
| GV (Giảng viên) | gv_phthy | 123456 |
| KTV (Kỹ thuật viên) | ktv1 | 123456 |
| SV (Sinh viên) | sv1 | 123456 |

## 5. Phạm vi MVP đã hoàn thành

### Đã làm (Sprint 1 - MVP này)

- ✅ Auth & RBAC cho 5 vai trò (QTV, CBDT, GV, KTV, SV)
- ✅ Quản lý phòng (CRUD cho 3 phòng MVP: 2B11, 2B21, 2B31)
- ✅ Tạo yêu cầu xếp lịch
- ✅ Auto-arrange (rule-based với 8 hard constraints + scoring đơn giản)
- ✅ Kiểm tra ràng buộc 8 rule (ROOM_SCOPE, ROOM_STATUS, ROOM_CONFLICT, LECTURER_CONFLICT, ROOM_BLOCKED, HOLIDAY_BLOCKED, CAPACITY_OK, SOFTWARE_OK)
- ✅ Tạo lịch, duyệt (approve), công bố (publish)
- ✅ Tra cứu lịch theo 5 vai trò với filter

### Đã làm (Sprint 2 — API layer và demo cuối kỳ)

- ✅ Quản lý user (tạo, xem, cập nhật, khóa), devices và software bằng API riêng
- ✅ Academic data master CRUD cho học kỳ, tuần học, ca học, học phần, lớp học phần và lớp hành chính
- ✅ Đổi lịch, hủy lịch, học bù qua `lab_schedule_change_requests`
- ✅ Sự cố phòng, yêu cầu khóa phòng và phản ánh sinh viên
- ✅ Thông báo theo người nhận và audit log cho các thao tác nghiệp vụ chính

### Không trong scope (Sprint 3+)

- ⏸️ Dashboard nâng cao và báo cáo thống kê
- ⏸️ Backup/Restore tự động
- ⏸️ Tối ưu thuật toán toàn cục (constraint satisfaction)
- ⏸️ Đồng bộ UIS thật

> **Ghi chú:** Database schema đã được thiết kế đầy đủ cho cả 17 module (30 bảng + 6 view). Sprint 2 hiện đã có API layer, UI integration chính và smoke evidence trong `docs/postman/test_results_final_demo.md`.

## 6. Quick demo flow (7 bước)

Sau khi cài đặt xong và chạy seed:

1. **Login CBDT** — `cbdt1` / `123456`
2. Vào **"Tạo yêu cầu xếp lịch"** → điền form (course_section, practice_team, số buổi) → Submit
3. Vào **"Auto-Arrange"** → chọn request vừa tạo → set preferred (ví dụ T4, ca 7-10) → bấm "Auto Arrange" → xem 3 phương án ranked
4. Chọn option score cao nhất → click "Use this option" → tạo lịch draft
5. Vào **"Lịch thực hành"** → chọn lịch draft → Approve → Publish
6. Logout → Login **SV** `sv1` / `123456` → xem lịch đã công bố
7. Logout → Login **GV** `gv_phthy` / `123456` → xem lịch dạy

## 7. Quy tắc phòng trong scope

Mọi chức năng xếp lịch phải lọc phòng theo danh sách cố định:

```js
['2B11', '2B21', '2B31']
```

Không đưa các phòng `2A16`, `2A35`, `2A36`, `2E36`, `1A...` vào MVP.

## 8. Branch workflow

Branch chính:

```text
main      # bản ổn định để nộp/demo
develop   # nhánh tích hợp chính
```

Branch chức năng:

```text
feature/auth
feature/user-management
feature/room-management
feature/academic-data
feature/schedule-request
feature/schedule-auto-arrange
feature/schedule-constraint
feature/frontend-layout
feature/frontend-schedule
feature/testing-report
```

Xem chi tiết tại:

```text
docs/git-workflow.md
```

## 9. Definition of Done

Một task chỉ được đánh dấu `Done` khi có đủ:

1. Code đã merge vào `develop`.
2. Chạy được local.
3. API có Postman test hoặc UI test.
4. Không lỗi console nghiêm trọng.
5. Có ảnh/chứng cứ nếu dùng cho báo cáo.
6. README hoặc ghi chú cập nhật nếu thay đổi cách chạy.

## 10. Tài liệu quan trọng

| File | Mục đích |
|---|---|
| `docs/scope-mvp-v1.md` | Scope MVP đã chốt |
| `docs/repo-structure.md` | Giải thích cấu trúc repo |
| `docs/git-workflow.md` | Quy trình branch/commit/PR |
| `docs/tasks/week1-priority3-checklist.md` | Checklist Priority 3 |
| `docs/api-contract/api-contract-v1.md` | Khung API contract ban đầu |
| `docs/report/outline.md` | Khung báo cáo theo biểu mẫu môn học |
| `docs/postman/README.md` | Quy định lưu Postman collection |
