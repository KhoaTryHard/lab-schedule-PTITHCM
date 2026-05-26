# Postman


```text
LabSchedulePTIT.postman_collection.json
LabSchedulePTIT.local.postman_environment.json
```
=======
## Các test cần có cho MVP

1. Login đúng/sai.
2. GET room scope.
3. Create schedule request.
4. Auto arrange success.
5. Auto arrange no valid option.
5.1. Create draft schedule valid.
5.2. Create draft schedule conflict.
6. Room conflict.
7. Lecturer conflict.
8. Insufficient computers.
9. Missing software.
10. Holiday blocked.
11. Room blocked.
12. Approve schedule.
13. Publish schedule.
14. Student/GV lookup published schedule.


file local.postman và posman_collection copy và paste vào thư mục postmant
, xóa đuôi example.

## Import Collection và Environment

1. Mở Postman.
2. Chọn **File > Import** hoặc nút **Import**.
3. Chọn 2 file trong thư mục này:
   - `LabSchedulePTIT.postman_collection.json`
   - `LabSchedulePTIT.local.postman_environment.json`
4. Ở góc trên bên phải Postman, chọn environment **LabSchedulePTIT.local** thay vì **No Environment**.

## Chuẩn bị account trước khi test login

Backend hiện tại dùng auth thật, không còn trả token demo cho mọi username/password. Trước khi chạy request `Login Success`, cần có user thật trong database và password phải được lưu bằng bcrypt hash.



1. Tạo file `backend/.env` từ `backend/.env.example`, đảm bảo có các giá trị:

```env
APP_PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lab_schedule_ptit_v2
JWT_SECRET=change_me_in_local_env
JWT_EXPIRES_IN=1d
```

2. Đảm bảo database đã được import từ dump:

```powershell
mysql -u root -p lab_schedule_ptit_v2 < database/Dump20260428.sql
```

3. Tạo bcrypt hash cho mật khẩu demo. Ví dụ dùng password `123456`:

```powershell
cd backend
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('123456',10).then(console.log)"
```

4. Thêm hoặc cập nhật user demo trong bảng `users`. Thay `<HASH_VUA_TAO>` bằng hash vừa in ra:

```sql
INSERT INTO users (username, password_hash, full_name, email, role_code, account_status)
VALUES ('admin1', '<HASH_VUA_TAO>', 'Admin Demo', 'admin@example.com', 'QTV', 'active')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role_code = 'QTV',
  account_status = 'active';
```

5. Trong request `Login Success`, dùng đúng account vừa tạo:

```json
{
  "username": "admin1",
  "password": "123456"
}
```

Nếu login đúng, response sẽ có `data.token`. Test script sẽ tự động lưu token này vào biến môi trường `auth_token`.

## Chạy các API

- Chạy backend trước:

```powershell
cd backend
npm run dev
```

- Chạy `0. Health Check` để kiểm tra server đang chạy.
- Chạy `1.1 Login Success` để lấy token.
- Các API cần auth sẽ gửi header:

```http
Authorization: Bearer {{auth_token}}
```

- Nếu chưa login được nhưng đã có JWT hợp lệ, có thể nhập token thủ công vào biến môi trường `auth_token`.
- `POST /schedules` tạo lịch draft thật trong MySQL và assert constraint thật. Chạy `5.1 Create draft schedule valid` trước, sau đó chạy `5.2 Create draft schedule conflict` để dùng lại cùng phòng/giảng viên/thứ/ca/ngày và kỳ vọng `409`.
- Sau `5.1`, biến `schedule_id` được ghi vào environment; chạy tiếp `12. Approve schedule` (`PATCH /schedules/:id/approve`) rồi `13. Publish schedule` (`PATCH /schedules/:id/publish`), sau đó `14. Student/GV lookup published schedule` (`GET /schedules/published`).
- Sau khi `5.1` đã tạo draft, có thể chạy tiếp:
  - `6. Room conflict`: gọi `/schedules/check-constraints` với cùng slot của `5.1`, kỳ vọng `200` nhưng `data.passed = false` và có `ROOM_CONFLICT`.
  - `7. Lecturer conflict`: gọi `/schedules/check-constraints` với cùng slot của `5.1`, kỳ vọng `200` nhưng `data.passed = false` và có `LECTURER_CONFLICT`.
  - Khác biệt quan trọng: `5.2` là API tạo lịch nên fail bằng HTTP `409`; còn `6/7` chỉ là API kiểm tra ràng buộc nên vẫn trả HTTP `200`, nhưng kết quả nghiệp vụ nằm ở `data.passed = false`.
- Các biến demo dùng cho request tạo lịch:
  - `demo_practice_team_id`: ID có thật trong `practice_teams`, nên có `planned_size` nhỏ hơn số máy khả dụng của phòng.
  - `demo_lecturer_user_id`: ID user giảng viên có thật trong `users`.
  - `demo_room_code`: phòng in-scope, mặc định `2B11`.
  - `demo_day_of_week`, `demo_time_slot`, `demo_start_date`, `demo_end_date`: slot test còn trống cho request thành công.
- Dữ liệu demo mặc định trong environment đang giả định có `rooms.room_code = '2B11'` ở trạng thái `available`, time slot khớp `7-10` hoặc `Tiết 7-10`, `practice_teams.id = 1`, `users.id = 3`, và ngày `2026-06-02` chưa bị trùng lịch/block/holiday trước khi chạy `5.1`. Nếu database local khác seed, cập nhật lại các biến demo trước khi chạy collection.
- Auto-arrange and check-constraints use real MySQL-backed rule-based logic; W4-08 requests assert business results, not only status codes.

## Ghi chú kết quả test

Có thể lưu log hoặc ghi chú kết quả vào:

```text
docs/postman/test_results.md
```

Nếu API chưa implement thật, ghi rõ là stub hoặc chưa pass thay vì đánh dấu pass.
