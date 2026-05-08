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
- Các API arrange/check-constraints hiện vẫn là stub/demo, chỉ nên assert status code cơ bản. Không đánh dấu pass nghiệp vụ nếu backend chưa xử lý dữ liệu thật.

## Ghi chú kết quả test

Có thể lưu log hoặc ghi chú kết quả vào:

```text
docs/postman/test_results.md
```

Nếu API chưa implement thật, ghi rõ là stub hoặc chưa pass thay vì đánh dấu pass.

