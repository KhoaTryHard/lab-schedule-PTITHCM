Kết quả chạy Postman Collection (Newman)
Kết quả test API bằng Postman/Newman cho thấy collection đã được thiết lập đúng với các request cơ bản cho Lab Schedule PTIT.
Tóm tắt

Total Requests: 19
Passed Assertions: 16
Failed Assertions: 3 (Chấp nhận được, do backend chưa implement)

Chi tiết các Test Failed
Các test dưới đây bị đánh dấu Failed vì backend chưa implement các module tương ứng.
Đúng với yêu cầu: "Không đánh dấu pass nếu API chưa chạy thật."

12. Approve schedule

Schedule status is approved → Failed (backend chưa trả data.status === "approved").


13. Publish schedule

Schedule status is published → Failed (backend chưa trả data.status === "published").


14. Student/GV lookup published schedule

Published schedule returned → Failed (backend chưa trả array có dữ liệu).



Khi backend implement xong các module tương ứng, các test trên sẽ Pass.
Ghi chú: Test đã Pass sau khi Auth RBAC thật được triển khai

1.2 Login Failed — trước đây fail trên stub (stub trả 200 cho mọi login).
Sau khi Auth RBAC thật được deploy, backend trả đúng 401 Unauthorized với success: false và message: "Invalid username or password" → cả 2 assertion đều Pass.

Log kết quả chi tiết
text→ 0. Health Check
  GET http://localhost:4000/api/health [200 OK, 475B, 53ms]
  √  Status code is 200

→ 1.1 Login Success
  POST http://localhost:4000/api/auth/login [200 OK, 512B, 28ms]
  √  Status code is 200
  √  Has token

→ 1.2 Login Failed
  POST http://localhost:4000/api/auth/login [401 Unauthorized, 424B, 7ms]
  √  Status code is 401
  √  Error message exists

→ 1.3 GET Current User (Auth Me)
  GET http://localhost:4000/api/auth/me [200 OK, 448B, 6ms]
  √  Status code is 200

→ 1.4 Logout
  POST http://localhost:4000/api/auth/logout [200 OK, 392B, 4ms]
  √  Status code is 200

→ 2. GET room scope
  GET http://localhost:4000/api/rooms/scope [200 OK, 493B, 4ms]
  √  Status code is 200

→ 3.1 GET schedule requests
  GET http://localhost:4000/api/schedule-requests [200 OK, 406B, 3ms]
  √  Status code is 200

→ 3. Create schedule request
  POST http://localhost:4000/api/schedule-requests [201 Created, 514B, 4ms]
  √  Status code is 201

→ 4. Auto arrange success
  POST http://localhost:4000/api/schedules/auto-arrange [200 OK, 498B, 4ms]
  √  Status code is 200

→ 5. Auto arrange no valid option
  POST http://localhost:4000/api/schedules/auto-arrange [200 OK, 502B, 3ms]
  √  Status code is 200

→ 6. Room conflict
  POST http://localhost:4000/api/schedules/check-constraints [200 OK, 486B, 3ms]
  √  Status code is 200

→ 7. Lecturer conflict
  POST http://localhost:4000/api/schedules/check-constraints [200 OK, 490B, 3ms]
  √  Status code is 200

→ 8. Insufficient computers
  POST http://localhost:4000/api/schedules/check-constraints [200 OK, 488B, 3ms]
  √  Status code is 200

→ 9. Missing software
  POST http://localhost:4000/api/schedules/check-constraints [200 OK, 492B, 4ms]
  √  Status code is 200

→ 10. Holiday blocked
  POST http://localhost:4000/api/schedules/check-constraints [200 OK, 495B, 3ms]
  √  Status code is 200

→ 11. Room blocked
  POST http://localhost:4000/api/schedules/check-constraints [200 OK, 489B, 3ms]
  √  Status code is 200

→ 12. Approve schedule
  POST http://localhost:4000/api/schedules/1/approve [200 OK, 480B, 3ms]
  √  Status code is 200
  1. Schedule status is approved

→ 13. Publish schedule
  POST http://localhost:4000/api/schedules/1/publish [200 OK, 478B, 3ms]
  √  Status code is 200
  1. Schedule status is published

→ 14. Student/GV lookup published schedule
  GET http://localhost:4000/api/schedules/published?schedule_request_id=1 [200 OK, 502B, 4ms]
  √  Status code is 200
  1. Published schedule returned