# Kết quả chạy Postman Collection (Tuần 3)

Báo cáo kết quả test API bằng Postman cho chức năng **Yêu cầu xếp lịch** (Schedule Requests) sau khi đã kết nối dữ liệu thật (MySQL).

## 1. Tóm tắt kết quả
- **Total Requests (Schedule Requests module):** 3
- **Passed Assertions:** 100% 
- **Status:** Hoàn thành mục tiêu tuần 3 (Bỏ hoàn toàn dữ liệu stub, kết nối thành công DB thực).

## 2. Chi tiết các Test Case đã Pass



### 2.1. Test Tạo yêu cầu hợp lệ
- **API:** `GET /api/schedule-requests`
- **Kịch bản:** Gửi request với đủ `course_section_id`, `requested_team_count`,... và gắn Bearer Token của QTV/CBDT.
- **Kết quả (PASS):**
  - Trả về mã lỗi `201 Created`.
  - Không còn chuỗi "stub" hay "demo-request-id" trong response.
  - Data được ghi thành công vào bảng `lab_schedule_requests` trong MySQL.

  **login --> lấy auth token, vào get schedule requests ở mục schedule requests 
  --> ở mục authorization đổi sang type: bearer token --> paste token vào
  --> send request --> thành công** 

  ** 2 mục còn lại ở Schedule làm tương tự **

### 2.2. Test Tạo yêu cầu thiếu dữ liệu
- **API:** `POST /api/schedule-requests Missing Data`
- **Kịch bản:** Cố tình xóa trường bắt buộc `course_section_id`.
- **Kết quả (PASS):**
  - Trả về mã lỗi `400 Bad Request`.
  - Message thông báo lỗi chính xác: `Missing required field: course_section_id`.

### 2.3. Test Lấy danh sách yêu cầu
- **API:** `GET /api/schedule-requests`
- **Kịch bản:** Lấy toàn bộ danh sách yêu cầu.
- **Kết quả (PASS):**
  - Trả về mã lỗi `200 OK`.
  - Body trả về là một mảng dữ liệu thật từ cơ sở dữ liệu.

### 2.4. Test Phân quyền (Role-based Authorization)
- **API:** Bất kỳ API nào thuộc module Yêu cầu xếp lịch.
- **Kịch bản:** Gọi API mà không có Token hoặc dùng tài khoản Role Sinh viên (`SV`).
- **Kết quả (PASS):**
  - Thiếu Token -> Báo lỗi `401 Unauthorized`.
  - Sai Role (Sinh viên) -> Báo lỗi `403 Forbidden` (`Forbidden: insufficient role`).
  
**  lưu ý cần chạy seed_student.js để tạo tài khoản sinh viên **


---
