# Báo Cáo Thực Hiện - [W4-08] Thay thế Stub Auto-Arrange bằng Thuật toán Thực tế

## 1. Nội dung đã thực hiện

### 1.1 Cập nhật Code Logic (Backend)
- Đã thay thế hoàn toàn phiên bản cũ và dữ liệu giả lập (stub) của `autoArrangeSchedule` trong file `backend/src/modules/schedules/schedule.service.js` bằng thuật toán 6 bước thực tế (Rule-based Filter & Scoring) theo đúng yêu cầu Issue #34.
- Đã đồng bộ việc gọi `await autoArrangeSchedule(req.body)` tại `backend/src/modules/schedules/schedule.controller.js`.

**Thuật toán thực thi 6 bước:**
1. Khởi tạo danh sách phòng (`2B11, 2B21, 2B31`), ca (`1-4, 7-10`), và ngày học (ngày ưu tiên hoặc T2-T6).
2. Sinh candidate matrix bằng vòng lặp lồng nhau cho tối đa 30 phương án.
3. Chạy `checkScheduleConstraints(cand)` cho từng phương án để loại bỏ các vi phạm ràng buộc cứng.
4. Chấm điểm các lịch hợp lệ: Base 50, Trùng ngày ưu tiên (+30), Trùng ca ưu tiên (+20), Có phần mềm được cài (+25).
5. Lấy top 3 phương án có điểm cao nhất sắp xếp giảm dần trả về qua `ranked_options`.
6. Tính toán log hiệu năng đo bằng `console.time`.

### 1.2 Cập nhật Postman (Testing Setup)
- **Environment**: File `LabSchedulePTIT.local.postman_environment.json` đã được tự động thêm biến `demo_large_practice_team_id` với giá trị `999` để phục vụ test case tràn dung lượng.
- **Collection**: File `LabSchedulePTIT.postman_collection.json` đã được chạy script để xóa các request cũ bị sai cấu trúc, và tự động thêm mới **4 Test Requests** hoàn chỉnh cho Auto Arrange:
    1. `4.1 Auto arrange - Success no preferred`
    2. `4.2 Auto arrange - Prefer day`
    3. `4.3 Auto arrange - No valid (Capacity)`
    4. `4.4 Auto arrange - Software constraint`
- Các request mới trong Postman đều đã được **viết sẵn Javascript Assertions** (tại tab Tests) để hệ thống Postman tự động "Pass" khi phản hồi từ backend khớp với đúng kỳ vọng của Issue.

---

## 2. Hướng dẫn Test


1. Mở Collection, chạy Request `1.1 Login Success` để hệ thống tự động lưu chuỗi `auth_token` vào environment.
2. Chạy lần lượt 4 request Auto-Arrange (nằm ở vị trí 4.1 đến 4.4).

---

## 3. Kết quả 

| STT | Tên Request trong Postman | Payload đặc trưng | Kết quả Test Script cần đạt (Màu Xanh) |
|---|---|---|---|
| **4.1** | `Auto arrange - Success no preferred` | Không truyền preferred day/slot | `Status is success` và `Score is 50` |
| **4.2** | `Auto arrange - Prefer day` | `preferred_day_of_week: 3` | `Status is success` và `Preferred day is selected and score is 80` |
| **4.3** | `Auto arrange - No valid (Capacity)` | `practice_team_id: {{demo_large_practice_team_id}}` (ID: 999) | `Status is no_valid_option` và bắt được lỗi vi phạm `CAPACITY_OK` | 
| **4.4** | `Auto arrange - Software constraint` | `required_software_ids: [1]` | `Status is success` và `Score is 75`, thông điệp `reasons` hiển thị nhận đủ phần mềm |

