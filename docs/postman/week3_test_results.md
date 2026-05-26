# Kết quả Báo Cáo Test Postman - Tuần 3 (Luồng Xếp Lịch Thực Hành)

> **Mục tiêu:** Báo cáo nghiệm thu test API bằng Postman cho toàn bộ luồng xếp lịch thực hành thật, bao gồm tạo yêu cầu, kiểm tra ràng buộc, tạo lịch draft, duyệt và công bố. (Được tổng hợp từ các kết quả W3-01, W3-03 và W3-04).

## 1. Môi trường Test (Environment)
- **Environment File**: `LabSchedulePTIT.local.postman_environment.json`
- **Base URL**: `http://localhost:4000/api`
- **Token**: Đã được lấy thông qua API Login (`1.1 Login Success`) với quyền `ACADEMIC_OFFICER` (CBDT) hoặc `ADMIN` (QTV),... dựa vào tài khoản người dùng trong database.
- **Trạng thái**: Đã kết nối với Database MySQL thật, không sử dụng dữ liệu giả (stub/mock).

---

## 2. Kết quả Test Các API (100% Passed)

### 2.1. Quản lý Yêu cầu Xếp lịch (Schedule Requests)


- [x] **Tạo yêu cầu hợp lệ** 
  - **Tên Request**: `Create Valid Schedule Request` (POST `/schedule-requests`)
  - **Kết quả thực tế**: `201 Created` - Yêu cầu xếp lịch được tạo thành công vào database với `request_status: "draft"`. Biến môi trường `schedule_request_id` tự động được gán.
- [x] **Lấy danh sách yêu cầu xếp lịch**
  - **Tên Request**: `Get Schedule Requests` (GET `/schedule-requests`)
  - **Kết quả thực tế**: `200 OK` - Trả về một mảng chứa thông tin các yêu cầu xếp lịch.

### 2.2. Kiểm tra Ràng buộc (Check Constraints)
 Gọi qua endpoint POST `/schedules/check-constraints`.*

- [x] **Check constraints case hợp lệ (All constraints passed)**
  - **Tên Request**: `CC-01 Check Constraints - Valid (All Pass)`
  - **Kết quả thực tế**: `200 OK` - `data.passed === true`. Tất cả ràng buộc từ Room, Lecturer, Capacity đều trả về `passed: true`.
- [x] **Check ROOM_CONFLICT (Trùng phòng)**
  - **Tên Request**: `CC-07 Check Constraints - Room Conflict`
  - **Kết quả thực tế**: `200 OK` - Tuy nhiên tổng quan `data.passed === false`, chi tiết mã lỗi `ROOM_CONFLICT` trả về `passed: false` (Phòng đã có lịch trong thời gian này).
- [x] **Check LECTURER_CONFLICT (Trùng lịch giảng viên)**
  - **Tên Request**: `CC-08 Check Constraints - Lecturer Conflict`
  - **Kết quả thực tế**: `200 OK` - Mã `LECTURER_CONFLICT` trả về `passed: false` (Giảng viên đã có lớp khác cùng ca).
- [x] **Check phòng không đủ máy hoặc không khả dụng**
  - **Tên Request**: `CC-09 Check Constraints - Capacity Fail (not enough computers)` và `CC-11 Check Constraints - Room Not Available (maintenance)`
  - **Kết quả thực tế**: `200 OK` - Các mã `CAPACITY_OK` và check trạng thái phòng trả về `passed: false`.
- [x] **Check thiếu phần mềm (nếu Database hỗ trợ)**
  - **Tên Request**: `CC-10 Check Constraints - Software Missing`
  - **Kết quả thực tế**: `200 OK` - Mã `SOFTWARE_OK` trả về `passed: false` do phòng không cài đủ phần mềm yêu cầu.

### 2.3. Tạo & Quản lý Lịch (Schedules)

- [x] **Tạo lịch draft khi API đã sẵn sàng**
  - **Tên Request**: `5.1 Create draft schedule valid` (POST `/schedules`)
  - **Kết quả thực tế**: `201 Created`. Data trả về chứa đối tượng schedule với trạng thái `entry_status: "draft"`. Biến môi trường `schedule_id` tự động được gán.
  - *(Ghi chú: Luồng code của API này đã tự động gọi qua Service Check Constraint. Nếu fail sẽ bắn lỗi `409 Conflict` - được test qua case `5.2 Create draft schedule conflict`).*
- [x] **Duyệt lịch - Approve (khi API đã sẵn sàng)**
  - **Tên Request**: `12. Approve schedule` (PATCH `/schedules/:id/approve`)
  - **Kết quả thực tế**: `200 OK`. Schedule trong Database đã được cập nhật thành công từ trạng thái `draft` sang `approved`.
- [x] **Công bố lịch - Publish (khi API đã sẵn sàng)**
  - **Tên Request**: `13. Publish schedule` (PATCH `/schedules/:id/publish`)
  - **Kết quả thực tế**: `200 OK`. Schedule tiếp tục được cập nhật từ trạng thái `approved` sang `published`. (Đã test lỗi `409` chặn không cho publish nếu chưa approve).

---

## 3. Tổng kết (Summary)
- **Coverage**: Toàn bộ luồng nghiệp vụ của Tuần 3 từ `Create Request` -> `Check Constraints` -> `Create Draft Schedule` -> `Approve` -> `Publish` đã hoàn tất 100%.
- **Pass Rate**: Tất cả các Tests và Assertions (Viết bằng Javascript trong mục Scripts của Postman) đều báo Pass (màu xanh).
- **Tình trạng Dữ liệu**: Tất cả các Endpoint đều tương tác TRỰC TIẾP với MySQL Database `lab_schedule_entries` (CRUD), không còn tồn đọng stub data nào. 
- Issue nghiệm thu này đã **HOÀN THÀNH**.
