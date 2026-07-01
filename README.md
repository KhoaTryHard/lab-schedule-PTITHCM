# Lab Schedule PTIT - Phân công lịch thực hành phòng máy

**Nhóm:** 24 (Hai4)

**Thành viên nhóm:** Nguyễn Đăng Khoa - N23DCCN030 (Trưởng nhóm), Bùi Huỳnh Tuấn Thành - N23DCAT065, Phạm Khánh Duy - N23DCCN152

**Ngày khởi tạo repo:** 28/04/2026

**Phạm vi MVP:** quản lý và tự động sắp xếp lịch thực hành cho 3 phòng máy `2B11`, `2B21`, `2B31`.

Repo này dùng mô hình **monorepo** để nộp đồ án và demo dễ hơn:

```text
lab-schedule-ptit/
  frontend/   # Next.js UI
  backend/    # Express.js API
  database/   # File SQL tạo CSDL + seed hiện tại
  docs/       # Scope, report, Postman, workflow
```

## 1. CSDL hiện tại

CSDL đang dùng là MySQL database `lab_schedule_ptit_v2`, được tạo và seed bằng một file SQL gộp:

```text
database/Nhom24_PhanMenPhanCongLichThucHanhTaiHVCS_Database.sql
```

File này gồm:

- Schema MySQL `utf8mb4`.
- Seed dữ liệu demo cho năm học `2026 - 2027`.
- Tài khoản demo có bcrypt password hash.
- 23 bảng nghiệp vụ và 6 view.

### 1.1 Nhóm bảng chính

| Nhóm | Bảng |
|---|---|
| Tài khoản và phân quyền | `users` |
| Học vụ | `semesters`, `academic_weeks`, `calendar_holidays`, `courses`, `course_sections`, `student_cohorts`, `course_registrations`, `course_section_lecturers`, `time_slots` |
| Phòng máy và thiết bị | `rooms`, `devices` |
| Điều kiện xếp lịch | `course_section_available_slots`, `practice_teams`, `practice_team_members` |
| Lịch thực hành | `lab_schedule_requests`, `lab_schedule_entries`, `lab_schedule_change_requests` |
| Vận hành phòng máy | `room_block_requests`, `room_issue_reports` |
| Thông báo và audit | `notifications`, `notification_recipients`, `workflow_audit_logs` |

### 1.2 View trong CSDL

| View | Mục đích |
|---|---|
| `vw_active_calendar_holidays` | Ngày nghỉ đang active và chặn xếp lịch |
| `vw_active_room_blocks` | Lịch khóa/chặn phòng đã duyệt |
| `vw_course_section_student_counts` | Số sinh viên đăng ký theo nhóm học phần |
| `vw_practice_team_student_counts` | Số sinh viên theo tổ thực hành |
| `vw_room_capacity` | Sức chứa phòng từ bảng `rooms` |
| `vw_room_pc_inventory` | Thống kê máy tính theo phòng trong scope MVP |

### 1.3 Lưu ý về schema

- CSDL hiện tại **không tách bảng riêng** cho `software_packages` hoặc `student_feedback`.
- Phản ánh sự cố phòng/thiết bị được lưu trong `room_issue_reports`.
- Yêu cầu khóa phòng, bảo trì, thi hoặc sự cố được lưu trong `room_block_requests`.
- Đổi lịch, học bù và hủy lịch được lưu trong `lab_schedule_change_requests`.
- Không dùng các tên dump cũ `Dump20260428.sql` và `seed_demo_final.sql`; schema và seed hiện tại đã gộp vào file SQL ở trên.

## 2. Luồng nghiệp vụ chính

```text
CBDT tạo yêu cầu xếp lịch thực hành
-> Hệ thống lấy danh sách phòng trong scope: 2B11, 2B21, 2B31
-> Thuật toán auto-arrange sinh phương án theo tuần/ngày/ca hợp lệ
-> Hệ thống kiểm tra ràng buộc phòng, giảng viên, ngày nghỉ, khóa phòng, sức chứa
-> CBDT xem preview và chọn phương án
-> Hệ thống tạo lịch thực hành draft
-> CBDT/QTV duyệt lịch
-> CBDT/QTV công bố lịch
-> GV/SV/KTV tra cứu lịch đã công bố
```

## 3. Công nghệ chốt

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React |
| Backend | Node.js, Express.js |
| Database | MySQL |
| API test | Postman |
| Quản lý source | GitHub, Git branch workflow |
| Tài liệu | Markdown, Word báo cáo môn học |

## 4. Cài đặt nhanh local

### 4.1 Database

Cần có MySQL client trong `PATH`. Từ thư mục gốc repo, import file SQL hiện tại:

```powershell
mysql --default-character-set=utf8mb4 -u root -p -e "SOURCE database/Nhom24_PhanMenPhanCongLichThucHanhTaiHVCS_Database.sql"
```

File SQL sẽ tự tạo database `lab_schedule_ptit_v2` và seed dữ liệu demo. Nếu `SOURCE` không nhận đường dẫn tương đối, mở MySQL client/Workbench/phpMyAdmin và chạy toàn bộ file:

```text
database/Nhom24_PhanMenPhanCongLichThucHanhTaiHVCS_Database.sql
```

Kiểm tra nhanh sau khi import:

```sql
USE lab_schedule_ptit_v2;
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SELECT username, role_code, account_status FROM users ORDER BY id LIMIT 12;
SELECT room_code, total_computers, usable_student_computers, room_status FROM rooms;
```

### 4.2 Backend

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

### 4.3 Frontend

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

## 5. Tài khoản demo

Sau khi import file SQL hiện tại, có thể đăng nhập bằng các tài khoản sau. Mật khẩu đều là `123456`.

| Vai trò | Username | Password |
|---|---|---|
| QTV (Admin) | `admin` | `123456` |
| CBDT (Giáo vụ) | `cbdt1` | `123456` |
| GV (Giảng viên) | `gv_ntbnguyen` | `123456` |
| KTV (Kỹ thuật viên) | `ktv1` | `123456` |
| SV (Sinh viên) | `sv1` | `123456` |

Seed hiện tại còn có thêm các tài khoản `gv_ky`, `gv_nguyen`, `gv_hai`, `gv_nam`, `gv_da`, `ktv_02`, `ktv_03` và nhiều sinh viên `sv_02` đến `sv_68`.

## 6. Phạm vi MVP đã hoàn thành

### Sprint 1 - MVP scheduling

- Auth và RBAC cho 5 vai trò: `QTV`, `CBDT`, `GV`, `KTV`, `SV`.
- Quản lý phòng trong scope MVP: `2B11`, `2B21`, `2B31`.
- Tạo yêu cầu xếp lịch thực hành bằng `lab_schedule_requests`.
- Auto-arrange rule-based cho lịch thực hành.
- Kiểm tra ràng buộc: phòng trong scope, trạng thái phòng, trùng phòng, trùng giảng viên, khóa phòng, ngày nghỉ, sức chứa.
- Tạo lịch trong `lab_schedule_entries`, duyệt lịch và công bố lịch.
- Tra cứu lịch theo vai trò.

### Sprint 2 - API layer và dữ liệu demo

- Quản lý tài khoản bằng `users`.
- CRUD dữ liệu học vụ: học kỳ, tuần học, ca học, học phần, nhóm học phần, lớp hành chính.
- Quản lý phòng và thiết bị bằng `rooms`, `devices`.
- Đổi lịch, học bù, hủy lịch qua `lab_schedule_change_requests`.
- Khóa/chặn phòng qua `room_block_requests`.
- Ghi nhận sự cố phòng/thiết bị qua `room_issue_reports`.
- Thông báo theo người nhận qua `notifications`, `notification_recipients`.
- Audit log nghiệp vụ qua `workflow_audit_logs`.

### Ngoài scope hiện tại

- Dashboard thống kê nâng cao.
- Tối ưu lịch bằng constraint solver toàn cục.
- Tích hợp đồng bộ UIS thật.
- Quản lý phần mềm phòng máy bằng bảng riêng.

## 7. Quick demo flow

Sau khi import CSDL và chạy backend/frontend:

1. Login CBDT: `cbdt1` / `123456`.
2. Vào chức năng tạo yêu cầu xếp lịch, chọn nhóm học phần, số tổ thực hành và số buổi cần xếp.
3. Vào Auto-arrange, chọn request vừa tạo, thiết lập ưu tiên ngày/ca nếu cần.
4. Chạy auto-arrange và xem danh sách phương án được xếp hạng.
5. Chọn phương án phù hợp để tạo lịch draft.
6. Vào lịch thực hành, duyệt và công bố lịch.
7. Đăng nhập SV `sv1` / `123456` để xem lịch đã công bố.
8. Đăng nhập GV `gv_ntbnguyen` / `123456` để xem lịch dạy.

## 8. Quy tắc phòng trong scope

Mọi chức năng xếp lịch phải lọc phòng theo danh sách cố định:

```js
["2B11", "2B21", "2B31"]
```

Không đưa các phòng `2A16`, `2A35`, `2A36`, `2E36`, `1A...` vào MVP.

## 9. Branch workflow

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

## 10. Definition of Done

Một task chỉ được đánh dấu `Done` khi có đủ:

1. Code đã merge vào `develop`.
2. Chạy được local.
3. API có Postman test hoặc UI test.
4. Không có lỗi console nghiêm trọng.
5. Có ảnh/chứng cứ nếu dùng cho báo cáo.
6. README hoặc ghi chú được cập nhật nếu thay đổi cách chạy hoặc schema CSDL.

## 11. Tài liệu quan trọng

| File | Mục đích |
|---|---|
| `docs/scope-mvp-v1.md` | Scope MVP đã chốt |
| `docs/repo-structure.md` | Giải thích cấu trúc repo |
| `docs/git-workflow.md` | Quy trình branch/commit/PR |
| `docs/api-contract/api-contract-v1.md` | Khung API contract ban đầu |
| `docs/report/outline.md` | Khung báo cáo theo biểu mẫu môn học |
| `docs/postman/README.md` | Quy định lưu Postman collection |
