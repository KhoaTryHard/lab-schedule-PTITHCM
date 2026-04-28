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

```bash
mysql -u root -p lab_schedule_ptit_v2 < database/Dump20260428.sql
```

Nếu dùng MySQL Workbench hoặc XAMPP phpMyAdmin, mở file:

```text
database/Dump20260428.sql
```

và chạy toàn bộ script.

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

## 4. Quy tắc phòng trong scope

Mọi chức năng xếp lịch phải lọc phòng theo danh sách cố định:

```js
['2B11', '2B21', '2B31']
```

Không đưa các phòng `2A16`, `2A35`, `2A36`, `2E36`, `1A...` vào MVP.

## 5. Branch workflow

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

## 6. Definition of Done

Một task chỉ được đánh dấu `Done` khi có đủ:

1. Code đã merge vào `develop`.
2. Chạy được local.
3. API có Postman test hoặc UI test.
4. Không lỗi console nghiêm trọng.
5. Có ảnh/chứng cứ nếu dùng cho báo cáo.
6. README hoặc ghi chú cập nhật nếu thay đổi cách chạy.

## 7. Tài liệu quan trọng

| File | Mục đích |
|---|---|
| `docs/scope-mvp-v1.md` | Scope MVP đã chốt |
| `docs/repo-structure.md` | Giải thích cấu trúc repo |
| `docs/git-workflow.md` | Quy trình branch/commit/PR |
| `docs/tasks/week1-priority3-checklist.md` | Checklist Priority 3 |
| `docs/api-contract/api-contract-v1.md` | Khung API contract ban đầu |
| `docs/report/outline.md` | Khung báo cáo theo biểu mẫu môn học |
| `docs/postman/README.md` | Quy định lưu Postman collection |
