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

## Auth/RBAC local test notes

The current SQL dump defines the `users` table schema but does not include demo
`INSERT INTO users` rows. To test login, use a local `users` row that has a
valid bcrypt `password_hash` and one of these `role_code` values: `QTV`, `CBDT`,
`GV`, `KTV`, `SV`.

Set `JWT_SECRET` in `backend/.env` before running the API.

```bash
# Login success. Response must include token and public user fields only.
curl.exe -i -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"123456\"}"

# Login missing username/password: expected 400.
curl.exe -i -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{}"

# Login wrong password: expected 401.
curl.exe -i -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"wrong\"}"

# Current user without token: expected 401.
curl.exe -i http://localhost:4000/api/auth/me

# Current user with token: expected 200.
curl.exe -i http://localhost:4000/api/auth/me -H "Authorization: Bearer <token>"

# Protected route with non-CBDT/non-QTV token: expected 403.
curl.exe -i -X POST http://localhost:4000/api/schedules/auto-arrange -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"request_id\":1}"

# Health remains public: expected 200.
curl.exe -i http://localhost:4000/api/health
```

## Endpoint skeleton hiện có

| Method | URL | Mục đích |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | JWT login |
| GET | `/api/auth/me` | Current user from JWT |
| POST | `/api/auth/logout` | Stateless JWT logout |
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
