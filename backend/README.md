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

## Room management local test notes

Room management APIs always stay inside MVP room scope: `2B11`, `2B21`, `2B31`.
They read from the real MySQL `rooms` table, so local DB rows for those room
codes are required to see data in `GET /api/rooms`.

```bash
# Scope room codes. Expected 200 with ["2B11","2B21","2B31"].
curl.exe -i http://localhost:4000/api/rooms/scope -H "Authorization: Bearer <token>"

# MVP room list from DB. QTV/CBDT/KTV can access.
curl.exe -i http://localhost:4000/api/rooms -H "Authorization: Bearer <token>"

# Filter by room_status.
curl.exe -i "http://localhost:4000/api/rooms?room_status=available" -H "Authorization: Bearer <token>"

# Room detail.
curl.exe -i http://localhost:4000/api/rooms/1 -H "Authorization: Bearer <token>"

# Update status/notes. QTV/CBDT only.
curl.exe -i -X PATCH http://localhost:4000/api/rooms/1 -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"room_status\":\"available\",\"notes\":\"Updated by W2-05 backend baseline\"}"

# Non-existing room update: expected 404.
curl.exe -i -X PATCH http://localhost:4000/api/rooms/999999 -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"room_status\":\"available\"}"
```

## Endpoint skeleton hiện có

| Method | URL | Mục đích |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | JWT login |
| GET | `/api/auth/me` | Current user from JWT |
| POST | `/api/auth/logout` | Stateless JWT logout |
| GET | `/api/rooms/scope` | Danh sách phòng 2B11/2B21/2B31 |
| GET | `/api/rooms` | MVP room list from MySQL |
| GET | `/api/rooms/:id` | MVP room detail from MySQL |
| PATCH | `/api/rooms/:id` | Update MVP room status/notes |
| POST | `/api/schedule-requests` | Stub tạo yêu cầu xếp lịch |
| POST | `/api/schedules` | Tạo lịch thực hành draft sau khi pass constraint |
| POST | `/api/schedules/check-constraints` | Real MySQL-backed schedule constraint check |
| POST | `/api/schedules/auto-arrange` | Real rule-based auto arrange preview |

## Quy tắc backend

1. Controller chỉ nhận request/response.
2. Service xử lý nghiệp vụ.
3. Repository/query làm việc với MySQL.
4. Không hard-code phòng ngoài `ROOM_SCOPE`.
5. Logic auto arrange phải có test case trước khi merge vào `develop`.
