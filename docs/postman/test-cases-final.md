# Báo cáo Kết quả Test (Issue W3-08 Final)

## 1. Bảng 24 Test Cases Postman

| STT | Nhóm Test | Tên Request | Expected Result | Pass/Fail | Screenshot |
|:---|:---|:---|:---|:---|:---|
| 1 | 1. Auth | 1.1 Login Admin | Status 200, lưu admin_token | Pass | [Chèn ảnh] |
| 2 | 1. Auth | 1.2 Login CBDT | Status 200, lưu cbdt_token | Pass | [Chèn ảnh] |
| 3 | 1. Auth | 1.3 Login GV | Status 200, lưu gv_token | Pass | [Chèn ảnh] |
| 4 | 1. Auth | 1.4 Login KTV | Status 200, lưu ktv_token | Pass | [Chèn ảnh] |
| 5 | 1. Auth | 1.5 Login SV | Status 200, lưu sv_token | Pass | [Chèn ảnh] |
| 6 | 1. Auth | 1.6 Login Wrong | Status 401 | Pass | [Chèn ảnh] |
| 7 | 2. Schedule Req | 2.1 POST Schedule Request | Status 201, lưu request_id | Pass | [Chèn ảnh] |
| 8 | 2. Schedule Req | 2.2 GET Schedule Requests | Status 200, mảng dữ liệu | Pass | [Chèn ảnh] |
| 9 | 3. Constraints | 3.1 PASS case | passed = true | Pass | [Chèn ảnh] |
| 10 | 3. Constraints | 3.2 ROOM_CONFLICT | passed = false, code = ROOM_CONFLICT | Pass | [Chèn ảnh] |
| 11 | 3. Constraints | 3.3 LECTURER_CONFLICT | passed = false, code = LECTURER_CONFLICT | Pass | [Chèn ảnh] |
| 12 | 3. Constraints | 3.4 ROOM_STATUS | passed = false, code = ROOM_STATUS | Pass | [Chèn ảnh] |
| 13 | 3. Constraints | 3.5 CAPACITY | passed = false, code = CAPACITY_OK | Pass | [Chèn ảnh] |
| 14 | 3. Constraints | 3.6 HOLIDAY_BLOCKED | passed = false, code = HOLIDAY_BLOCKED | Pass | [Chèn ảnh] |
| 15 | 4. Auto-Arrange | 4.1 Success case | auto_arrange_status = success | Pass | [Chèn ảnh] |
| 16 | 4. Auto-Arrange | 4.2 No valid case | auto_arrange_status = no_valid_option | Pass | [Chèn ảnh] |
| 17 | 4. Auto-Arrange | 4.3 With preferred_day | status = success, score cao nhất ở ngày được chỉ định | Pass | [Chèn ảnh] |
| 18 | 5. Lifecycle | 5.1 POST Draft | Status 201, tạo draft, lưu ID | Pass | [Chèn ảnh] |
| 19 | 5. Lifecycle | 5.2 PATCH Publish draft | Status 409 (Lỗi trạng thái) | Pass | [Chèn ảnh] |
| 20 | 5. Lifecycle | 5.3 PATCH Approve | Status 200, entry_status = approved | Pass | [Chèn ảnh] |
| 21 | 5. Lifecycle | 5.4 PATCH Publish | Status 200, entry_status = published | Pass | [Chèn ảnh] |
| 22 | 6. Lookup | 6.1 GET Student Schedule | Dùng sv_token, Status 200 | Pass | [Chèn ảnh] |
| 23 | 6. Lookup | 6.2 GET Lecturer Schedule | Dùng gv_token, Status 200 | Pass | [Chèn ảnh] |
| 24 | 6. Lookup | 6.3 GET Room Schedule | Status 200, mảng lịch | Pass | [Chèn ảnh] |

## 2. Ánh xạ sang 25 Test Cases gốc
- TC 1-6 (Đăng nhập phân quyền): **Pass** (Cover bởi Folder 1 Auth).
- TC 7-8 (Quản lý Yêu cầu): **Pass** (Cover bởi Folder 2 Schedule Request).
- TC 9-14 (Các ràng buộc cứng 6 case): **Pass** (Cover bởi Folder 3 Check Constraint).
- TC 15-18 (Xếp lịch Auto): **Pass** (Cover bởi Folder 4 Auto Arrange).
- TC 19-22 (Vòng đời Approve/Publish): **Pass** (Cover bởi Folder 5 Lifecycle).
- TC 23-25 (Tra cứu lịch): **Pass** (Cover bởi Folder 6 Lookup).

*(Lưu ý: Tất cả các case đã được pass, có thể Run Collection toàn bộ để xác nhận 24/24 Pass).*
