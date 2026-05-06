# Frontend - Next.js

## Chạy local

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Route skeleton

| Route                         | Vai trò  | Mục đích                            |
| ----------------------------- | -------- | ----------------------------------- |
| `/login`                      | All      | Đăng nhập                           |
| `/admin`                      | QTV      | Dashboard quản trị                  |
| `/admin/rooms`                | QTV/CBDT | Quản lý phòng                       |
| `/academic/schedule-requests` | CBDT     | Tạo yêu cầu xếp lịch                |
| `/academic/auto-arrange`      | CBDT     | Preview phương án xếp phòng tự động |
| `/academic/schedules`         | CBDT     | Quản lý, duyệt, công bố lịch        |
| `/lecturer/my-schedule`       | GV       | Lịch dạy thực hành                  |
| `/technician/room-schedule`   | KTV      | Lịch sử dụng phòng                  |
| `/student/my-schedule`        | SV       | Lịch thực hành đã công bố           |
| `/unauthorized`               | All      | Không có quyền                      |

## Quy tắc UI

1. Không clone toàn bộ UIS.
2. Chỉ hiển thị nghiệp vụ lịch thực hành phòng máy.
3. Filter phòng mặc định chỉ gồm `2B11`, `2B21`, `2B31`.
4. Màn CBDT phải có nút `Auto Arrange` và phần preview phương án.
