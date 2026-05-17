# Kết quả chạy Postman Collection (Tuần 3)

**Báo cáo kết quả test API** cho chức năng **Yêu cầu xếp lịch (Schedule Requests)** sau khi hoàn tất tất cả các sửa đổi theo feedback w3-01.

## 1. Tóm tắt kết quả

- **Module:** Schedule Requests  
- **Tổng số test cases trong folder "Schedule Requests":** **8**  
- **Passed Assertions:** **100%** (tất cả test đều pass)  
- **Status:**  **Hoàn thành xuất sắc** mục tiêu tuần 3  
- **Đã khắc phục toàn bộ 5 vấn đề** reviewer yêu cầu ở w3-01  
- **Đã kết nối hoàn toàn với dữ liệu thật** (MySQL), không còn stub data.

## 2. Các thay đổi đã thực hiện (theo feedback w3-01)

1. Controller sử dụng `asyncHandler` + `express-validator` (không còn try/catch thủ công).
2. Thêm validation chặt chẽ cho `course_section_id`, `requested_team_count`, `total_required_sessions`, `preferred_day_of_week`.
3. Fix bug so sánh type ownership (`Number()` comparison) cho CBDT.
4. Sửa body của test "3. Create schedule request" và test trong folder để phù hợp với API mới.
5. Bổ sung đầy đủ **5 scenario quan trọng** còn thiếu:
   - GET `/schedule-requests/:id`
   - PATCH `/schedule-requests/:id/submit`
   - Submit khi đã `pending_review` → **400**
   - Không có token → **401**
   - Sai role  → **403**

## 3. Chi tiết các Test Case đã Pass

### 3.1. Create Valid Schedule Request
- **API:** `POST /schedule-requests`
- **Kịch bản:** Tạo yêu cầu hợp lệ với `course_section_id`, `requested_team_count`, `total_required_sessions`.
- **Kết quả:** **201 Created**, trả về `data.id`, lưu thành công vào DB, không còn stub data.

### 3.2. Create Schedule Request Missing Data
- **API:** `POST /schedule-requests`
- **Kịch bản:** Thiếu trường bắt buộc `course_section_id`.
- **Kết quả:** **400 Bad Request** (validation error).

### 3.3. Get Schedule Requests (List)
- **API:** `GET /schedule-requests`
- **Kết quả:** **200 OK**, trả về mảng dữ liệu thật từ MySQL.

### 3.4. Get Schedule Request by ID
- **API:** `GET /schedule-requests/{{schedule_request_id}}`
- **Kết quả:** **200 OK**, trả về chi tiết request chính xác.

### 3.5. Submit Schedule Request
- **API:** `PATCH /schedule-requests/{{schedule_request_id}}/submit`
- **Kết quả:** **200 OK**, `request_status` chuyển thành `pending_review`.

### 3.6. Submit Schedule Request - Already Submitted (Negative Case)
- **API:** `PATCH /schedule-requests/{{schedule_request_id}}/submit` (gọi lần 2)
- **Kết quả:** **400 Bad Request** với message `"Chỉ có thể gửi yêu cầu ở trạng thái draft"`.

### 3.7. Get Schedule Request - No Token (Security)
- **API:** `GET /schedule-requests/{{schedule_request_id}}` (không có Authorization)
- **Kết quả:** **401 Unauthorized**.

### 3.8. Get Schedule Request - Wrong Role (GV) (Authorization)
- **API:** `GET /schedule-requests/{{schedule_request_id}}` (dùng token của GV)
- **Kết quả:** **403 Forbidden** (middleware `requireRoles` chặn đúng).

## 4. Hướng dẫn chạy test

1. Chạy **Login Success** (`admin1`) để lấy `auth_token`.
2. Chạy **Create Valid Schedule Request** → tự động set `schedule_request_id`.
3. Chạy toàn bộ folder **"Schedule Requests"**.
4. Test **Wrong Role (Student)**: Login bằng tài khoản GV (`student1` hoặc tương tự) và thay token tương ứng.
5. (Tùy chọn) Chạy `seed_student.js` nếu cần test role Sinh viên.

## 5. Kết luận

Sau khi sửa controller, routes, service, validation và bổ sung đầy đủ Postman tests, **toàn bộ 8 test case trong module Schedule Requests đều pass 100%** với dữ liệu thật từ MySQL.  

