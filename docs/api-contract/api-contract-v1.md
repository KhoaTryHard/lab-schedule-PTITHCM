# API Contract v1

**Base URL:** `http://localhost:4000/api`  
**Định dạng (Format):** JSON  
**Quyền truy cập (Roles):** `ACADEMIC_OFFICER` (CBDT), `LECTURER` (GV), `STUDENT` (SV), `TECHNICIAN` (KTV), `ADMIN`

## Mã lỗi chung (Common Error Codes)
- `400 Bad Request`: Lỗi tham số hoặc dữ liệu đầu vào. (Ví dụ: `INVALID_INPUT`, `MISSING_FIELD`)
- `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn. (Ví dụ: `UNAUTHORIZED`, `TOKEN_EXPIRED`)
- `403 Forbidden`: Không có quyền truy cập endpoint này. (Ví dụ: `FORBIDDEN`)
- `404 Not Found`: Không tìm thấy tài nguyên. (Ví dụ: `NOT_FOUND`)
- `500 Internal Server Error`: Lỗi hệ thống backend. (Ví dụ: `SERVER_ERROR`)

---

## 1. Health
- **Mục đích:** Kiểm tra trạng thái hoạt động của server.
- **Endpoint:** `GET /health`
- **Quyền truy cập:** Public
- **Request:** Không có
- **Response (200 OK):**
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

---

## 2. Auth

### 2.1. Đăng nhập
- **Mục đích:** Xác thực người dùng và cấp token.
- **Endpoint:** `POST /auth/login`
- **Quyền truy cập:** Public
- **Mã lỗi riêng:** `INVALID_CREDENTIALS` (401)
- **Request Body:**
```json
{
  "username": "user1",
  "password": "password123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Demo login successful",
  "data": {
    "token": "demo-token",
    "user": {
      "id": 1,
      "username": "user1",
      "full_name": "Demo Academic Officer",
      "role_code": "CBDT"
    }
  }
}
```

### 2.2. Lấy thông tin người dùng hiện tại
- **Mục đích:** Trả về thông tin của user đang đăng nhập.
- **Endpoint:** `GET /auth/me`
- **Quyền truy cập:** Đã đăng nhập (Any Role)
- **Headers:** `Authorization: Bearer <token>`
- **Request:** Không có
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "username": "user1",
    "full_name": "Demo Academic Officer",
    "role_code": "CBDT"
  }
}
```

### 2.3. Đăng xuất
- **Mục đích:** Hủy token hiện tại.
- **Endpoint:** `POST /auth/logout`
- **Quyền truy cập:** Đã đăng nhập (Any Role)
- **Headers:** `Authorization: Bearer <token>`
- **Request:** Không có
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

---

## 3. Rooms

### 3.1. Lấy danh sách phòng trong scope
- **Mục đích:** Trả về danh sách phòng máy dùng để xếp lịch.
- **Endpoint:** `GET /rooms/scope`
- **Quyền truy cập:** Đã đăng nhập (Any Role)
- **Headers:** `Authorization: Bearer <token>`
- **Request:** Không có
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": ["2B11", "2B21", "2B31"]
}
```

### 3.2. MVP room list
- **Purpose:** Return room records from MySQL, limited to MVP scope `2B11`, `2B21`, `2B31`.
- **Endpoint:** `GET /rooms`
- **Access:** `ADMIN` (QTV), `ACADEMIC_OFFICER` (CBDT), `TECHNICIAN` (KTV)
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `room_code`, `room_status`, `scope=mvp`, `in_scope=true` (optional)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "room_code": "2B11",
      "total_computers": 40,
      "broken_computers": 2,
      "reserved_teacher_computers": 1,
      "usable_computers": 38,
      "usable_student_computers": 37,
      "room_status": "available",
      "notes": "Ready for lab schedule"
    }
  ]
}
```

### 3.3. MVP room detail
- **Purpose:** Return one room record from MySQL if it belongs to MVP scope.
- **Endpoint:** `GET /rooms/:id`
- **Access:** `ADMIN` (QTV), `ACADEMIC_OFFICER` (CBDT), `TECHNICIAN` (KTV)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "room_code": "2B11",
    "total_computers": 40,
    "broken_computers": 2,
    "reserved_teacher_computers": 1,
    "usable_computers": 38,
    "usable_student_computers": 37,
    "room_status": "available",
    "notes": "Ready for lab schedule"
  }
}
```

### 3.4. Update MVP room status/notes
- **Purpose:** Update safe baseline fields for one MVP room.
- **Endpoint:** `PATCH /rooms/:id`
- **Access:** `ADMIN` (QTV), `ACADEMIC_OFFICER` (CBDT)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "room_status": "available",
  "notes": "Updated by W2-05 backend baseline"
}
```
- **Valid room_status values:** `available`, `maintenance`, `out_of_order`, `locked`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "room_code": "2B11",
    "room_status": "available",
    "notes": "Updated by W2-05 backend baseline"
  }
}
```

---

## 4. Schedule Requests (Yêu cầu xếp lịch)

### 4.1. Lấy danh sách yêu cầu
- **Mục đích:** Xem danh sách các yêu cầu xếp lịch thực hành.
- **Endpoint:** `GET /schedule-requests`
- **Quyền truy cập:** `ACADEMIC_OFFICER`, `ADMIN`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully fetched schedule requests",
  "data": [
    {
      "id": 1,
      "course_section_id": 1,
      "requested_team_count": 2,
      "request_status": "draft",
      "created_at": "2026-04-28T10:00:00Z"
    }
  ]
}
```

### 4.2. Tạo yêu cầu xếp lịch
- **Mục đích:** Tạo một yêu cầu xếp lịch mới.
- **Endpoint:** `POST /schedule-requests`
- **Quyền truy cập:** `ACADEMIC_OFFICER`, `ADMIN`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "course_section_id": 1,
  "requested_team_count": 2,
  "total_required_sessions": 3
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Successfully created schedule request",
  "data": {
    "id": 1,
    "course_section_id": 1,
    "request_status": "draft"
  }
}
```

### 4.3. Xem chi tiết yêu cầu xếp lịch
- **Mục đích:** Xem chi tiết một yêu cầu xếp lịch.
- **Endpoint:** `GET /schedule-requests/:id`
- **Quyền truy cập:** `ACADEMIC_OFFICER`, `ADMIN`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully fetched schedule request",
  "data": {
    "id": 1,
    "course_section_id": 1,
    "request_status": "draft"
  }
}
```

### 4.4. Gửi yêu cầu xếp lịch
- **Mục đích:** Gửi yêu cầu (chuyển trạng thái từ draft sang pending_review).
- **Endpoint:** `PATCH /schedule-requests/:id/submit`
- **Quyền truy cập:** `ACADEMIC_OFFICER`, `ADMIN`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully submitted schedule request",
  "data": {
    "id": 1,
    "request_status": "pending_review"
  }
}
```

---

## 5. Schedules (Lịch thực hành)

### 5.1. Create draft schedule
- **Purpose:** Tạo một lịch thực hành nháp trong bảng `lab_schedule_entries`.
- **Endpoint:** `POST /schedules`
- **Access:** `ACADEMIC_OFFICER` (CBDT), `ADMIN` (QTV)
- **Headers:** `Authorization: Bearer <token>`
- **Minimal Request Body:**
```json
{
  "lab_schedule_request_id": 1,
  "practice_team_id": 1,
  "room_code": "2B11",
  "lecturer_user_id": 3,
  "day_of_week": 3,
  "time_slot": "7-10",
  "start_date": "2026-06-02",
  "end_date": "2026-06-02"
}
```
- **Optional fields:** `available_slot_id`, `required_software_ids`, `notes`.
- **Note:** `time_slot` accepts either the exact database label such as `Tiết 7-10` or the short period range `7-10`.
- **Validation before insert:** API gọi schedule constraint service trước khi lưu. API không insert nếu có hard constraint fail, bao gồm `ROOM_CONFLICT`, `LECTURER_CONFLICT`, room scope/status/block, holiday block, capacity hoặc software requirement.
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Successfully created draft schedule",
  "data": {
    "schedule": {
      "id": 9,
      "practice_team_id": 1,
      "room_code": "2B11",
      "lecturer_user_id": 3,
      "day_of_week": 3,
      "time_slot": "7-10",
      "start_date": "2026-06-02",
      "end_date": "2026-06-02",
      "entry_status": "draft"
    },
    "constraints": {
      "passed": true,
      "results": [
        {
          "code": "ROOM_CONFLICT",
          "passed": true,
          "message": "No room conflict detected"
        }
      ]
    }
  }
}
```
- **Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Schedule constraints failed",
  "details": {
    "passed": false,
    "results": [
      {
        "code": "ROOM_CONFLICT",
        "passed": false,
        "message": "Room is already booked for 1 session(s) overlapping this period"
      },
      {
        "code": "LECTURER_CONFLICT",
        "passed": false,
        "message": "Lecturer has 1 conflicting session(s) in this period"
      }
    ]
  }
}
```

### 5.2. Kiểm tra ràng buộc (Check Constraints)
- **Mục đích:** Kiểm tra tính hợp lệ của một phương án xếp lịch (so với các ràng buộc cứng).
- **Endpoint:** `POST /schedules/check-constraints`
- **Quyền truy cập:** `ACADEMIC_OFFICER`, `ADMIN`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "room_code": "2B11",
  "lecturer_user_id": 10,
  "practice_team_id": 20,
  "day_of_week": 3,
  "time_slot": "7-10",
  "start_date": "2026-04-28",
  "end_date": "2026-05-28"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Constraint check stub",
  "data": {
    "passed": true,
    "results": [
      {
        "code": "ROOM_SCOPE",
        "passed": true,
        "message": "Room 2B11 is in MVP scope"
      },
      {
        "code": "HOLIDAY_BLOCKED",
        "passed": true,
        "message": "Date is not blocked by demo holiday rule"
      },
      {
        "code": "ROOM_CONFLICT",
        "passed": true,
        "message": "Stub: no room conflict detected"
      },
      {
        "code": "LECTURER_CONFLICT",
        "passed": true,
        "message": "Stub: no lecturer conflict detected"
      },
      {
        "code": "CAPACITY_OK",
        "passed": true,
        "message": "Stub: room has enough usable computers"
      },
      {
        "code": "SOFTWARE_OK",
        "passed": true,
        "message": "Stub: required software is installed"
      }
    ]
  }
}
```

### 5.3. Chạy thuật toán tự động xếp lịch (Auto Arrange)
- **Mục đích:** Chạy thuật toán để tự động tìm phương án xếp lịch (phòng/ca) tốt nhất.
- **Endpoint:** `POST /schedules/auto-arrange`
- **Quyền truy cập:** `ACADEMIC_OFFICER`, `ADMIN`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
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
  "end_date": "2026-05-28",
  "required_software_ids": [1, 2]
}
```
- **Response (200 OK):**
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
      "score": 90,
      "reasons": [
        "In MVP room scope",
        "Passes demo hard constraints",
        "Ranked by simple rule-based scoring stub"
      ]
    },
    "ranked_options": [
      {
        "room_code": "2B11",
        "day_of_week": 3,
        "time_slot": "7-10",
        "start_date": "2026-04-28",
        "end_date": "2026-04-28",
        "score": 90,
        "reasons": [
          "In MVP room scope",
          "Passes demo hard constraints",
          "Ranked by simple rule-based scoring stub"
        ]
      },
      {
        "room_code": "2B21",
        "day_of_week": 3,
        "time_slot": "7-10",
        "start_date": "2026-04-28",
        "end_date": "2026-04-28",
        "score": 85,
        "reasons": [
          "In MVP room scope",
          "Passes demo hard constraints",
          "Ranked by simple rule-based scoring stub"
        ]
      },
      {
        "room_code": "2B31",
        "day_of_week": 3,
        "time_slot": "7-10",
        "start_date": "2026-04-28",
        "end_date": "2026-04-28",
        "score": 80,
        "reasons": [
          "In MVP room scope",
          "Passes demo hard constraints",
          "Ranked by simple rule-based scoring stub"
        ]
      }
    ],
    "failed_reasons": []
  }
}
```
