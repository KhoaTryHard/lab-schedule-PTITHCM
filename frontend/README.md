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

## Những việc đã làm báo cáo lần 1

- Đã tách và hoàn thiện landing page `homePage` cho PTIT HCM Management System theo mẫu Stitch.
- Đã tạo file `app/homePage.jsx` làm trang chủ và route `/` đang render từ trang này.
- Đã tách style landing page ra file riêng `app/homePage.css` để dễ quản lý, không để CSS chung trong 1 file JSX.
- Đã hoàn thiện giao diện `/login`, `/login/forgotPassword`, `/login/resetPassword` theo phong cách glassmorphism.
- Đã dùng ảnh nền campus làm mờ cho nhóm trang đăng nhập và đổi màu chính sang tông đỏ sẫm PTIT.
- Đã chỉnh logo, kích thước logo, bỏ viền trắng khung logo ở khu vực đăng nhập.
- Đã tạo `AppShell` dùng lại được cho dashboard và tạo component `sidebarNavItem` nhận `icon`, `itemName`, `href`, `isActive`.
- Đã tạo layout riêng cho vai trò quản trị viên tại `app/admin/layout.jsx`.
- Đã hoàn thiện sidebar admin theo giao diện Stitch: sidebar bên trái, top bar bên trên, avatar admin ở cuối sidebar.
- Đã đổi màu sidebar admin từ xanh sang đỏ sẫm để đồng bộ với nhận diện PTIT.
- Đã tạo các route mẫu cho admin để sidebar bám thật:
  `/admin`, `/admin/accounts`, `/admin/rooms`, `/admin/trainingData`, `/admin/lookups`, `/admin/reports`, `/admin/settings`.
- Đã sửa lỗi sidebar admin bị quá dài, khi vừa vào trang đã nhìn thấy ngay khối `Admin PTIT HCM / Quản trị hệ thống`.
- Đã đổi font gốc toàn app sang `Be Vietnam Pro` có hỗ trợ tiếng Việt.
- Đã sửa các chuỗi tiếng Việt bị lỗi mã hóa trong khu vực admin để hiển thị đúng.
- Đã nhiều lần kiểm tra bằng `npm run build` và build hiện tại đang pass.
- Trạng thái hiện tại: có thể tiếp tục làm sang sidebar cho 4 vai trò còn lại hoặc bổ sung dữ liệu thật cho các trang admin.

### Việc cần làm tiếp theo

- hoàn thành toàn bộ giao diện của admin
- cần api để kết nối tới cơ sở dữ liệu và render lên dữ liệu đúng
- cần hoàn thành admin
