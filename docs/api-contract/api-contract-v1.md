# API Contract v1 - Skeleton

Base URL local:

```text
http://localhost:4000/api
```

## 1. Health

```http
GET /health
```

Response:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "service": "lab-schedule-ptit-backend",
    "status": "running",
    "room_scope": ["2B11", "2B21", "2B31"]
  }
}
```

## 2. Auth

```http
POST /auth/login
GET /auth/me
POST /auth/logout
```

## 3. Room scope

```http
GET /rooms/scope
```

Chỉ trả phòng trong scope:

```json
["2B11", "2B21", "2B31"]
```

## 4. Schedule requests

```http
GET /schedule-requests
POST /schedule-requests
```

## 5. Check constraints

```http
POST /schedules/check-constraints
```

Request mẫu:

```json
{
  "room_code": "2B11",
  "lecturer_user_id": 10,
  "practice_team_id": 20,
  "day_of_week": 3,
  "time_slot": "7-10",
  "start_date": "2026-04-28",
  "end_date": "2026-04-28"
}
```

## 6. Auto arrange

```http
POST /schedules/auto-arrange
```

Request mẫu:

```json
{
  "request_id": 1,
  "course_section_id": 100,
  "practice_team_id": 200,
  "lecturer_user_id": 10,
  "student_count": 40,
  "preferred_day_of_week": 3,
  "preferred_time_slot": "7-10",
  "start_date": "2026-04-28",
  "end_date": "2026-04-28",
  "required_software_ids": [1, 2]
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Auto arrange preview stub",
  "data": {
    "request_id": 1,
    "auto_arrange_status": "success",
    "selected_option": {
      "room_code": "2B11",
      "day_of_week": 3,
      "time_slot": "7-10",
      "start_date": "2026-04-28",
      "end_date": "2026-04-28",
      "score": 90
    },
    "ranked_options": [],
    "failed_reasons": []
  }
}
```

Ghi chú: file này là skeleton để Duy tiếp tục hoàn thiện contract thật.
