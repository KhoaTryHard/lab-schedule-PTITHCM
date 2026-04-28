# Backend - Express.js API

## Chạy local

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## API base URL

```text
http://localhost:4000/api
```

## Endpoint skeleton hiện có

| Method | URL | Mục đích |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Stub login |
| GET | `/api/auth/me` | Stub current user |
| GET | `/api/rooms/scope` | Danh sách phòng 2B11/2B21/2B31 |
| POST | `/api/schedule-requests` | Stub tạo yêu cầu xếp lịch |
| POST | `/api/schedules/check-constraints` | Stub kiểm tra ràng buộc |
| POST | `/api/schedules/auto-arrange` | Stub preview thuật toán auto arrange |

## Quy tắc backend

1. Controller chỉ nhận request/response.
2. Service xử lý nghiệp vụ.
3. Repository/query làm việc với MySQL.
4. Không hard-code phòng ngoài `ROOM_SCOPE`.
5. Logic auto arrange phải có test case trước khi merge vào `develop`.
