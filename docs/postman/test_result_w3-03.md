1. Tóm tắt kết quả

Module: Schedule
Endpoint chính: POST /api/schedules (tạo lịch draft)
Tổng số test case liên quan: 15+ (5.1, 5.2 + 11 test trong folder Schedule Constraints)
Passed Assertions: 100%
Status:  Hoàn thành yêu cầu của issue W3-03
Đã kết nối và hoạt động hoàn toàn với dữ liệu thật từ MySQL.

2. Kết quả thực hiện theo yêu cầu issue

Yêu cầu,Kết quả đạt được

Rà soát bảng lab_schedule_entries và các khóa ngoại liên quan,"Đã rà soát schema trong database/Dump20260428.sql. Bảng sử dụng các FK chính: practice_team_id, room_id, lecturer_user_id, time_slot_id, lab_schedule_request_id, available_slot_id, created_by_user_id."

Thiết kế request body tối thiểu cho việc tạo lịch draft,"Đã thiết kế body tối thiểu gồm: 
lab_schedule_request_id, practice_team_id, room_code, lecturer_user_id, day_of_week, time_slot, start_date, end_date, required_software_ids, notes."

Implement POST /api/schedules để tạo lịch thực hành,"Đã implement đầy đủ: route trong schedule.routes.js, controller trong schedule.controller.js, service trong schedule.service.js."

Gọi service kiểm tra ràng buộc trước khi lưu lịch,Đã gọi checkScheduleConstraints() trong createDraftSchedule() trước khi insert vào DB.

Không cho lưu lịch nếu ràng buộc không đạt,Đã xử lý: nếu constraintResult.passed = false thì trả 409 Conflict và không insert vào bảng lab_schedule_entries.

Lưu lịch với trạng thái phù hợp ở mức MVP (draft),Đã lưu với entry_status = 'draft'.

Trả về thông tin lịch vừa tạo,Đã trả về object schedule vừa insert kèm constraints result.
"Bảo vệ API bằng Auth/RBAC, chỉ QTV/CBDT được thao tác","Đã dùng requireAuth + requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN)."

Cập nhật API contract nếu có endpoint mới,Đã cập nhật docs/api-contract/api-contract-v1.md.


3. Output đạt được theo yêu cầu

API tạo lịch draft lưu được vào MySQL: Đã hoàn thành (POST /api/schedules insert thành công vào lab_schedule_entries).
Không lưu lịch nếu có ROOM_CONFLICT hoặc LECTURER_CONFLICT: Đã triển khai constraint check bao gồm cả draft/approved/published; nếu conflict thì trả 409.
Không lưu lịch nếu phòng không đủ điều kiện theo constraint service: Đã giữ đầy đủ logic check: room scope, room status, room blocked, holiday blocked, capacity, software.
Có Postman test tạo lịch hợp lệ: Đã thêm và pass test 5.1 Create draft schedule valid (201 Created).
Có Postman test tạo lịch thất bại do vi phạm ràng buộc: Đã thêm và pass test 5.2 Create draft schedule conflict (409 Conflict).
Có ghi chú rõ dữ liệu demo dùng để test: Đã thêm các biến demo_* trong environment và ghi chú chi tiết trong docs/postman/README.md.

4. Chi tiết các Test Case đã Pass

4.1. Test tạo lịch draft

5.1 Create draft schedule valid → 201 Created, entry_status = "draft", constraints.passed = true
5.2 Create draft schedule conflict → 409 Conflict, trả về chi tiết conflicts (ROOM_CONFLICT, LECTURER_CONFLICT)


4.2. Folder Schedule Constraints (11 test cases)

CC-01: Valid (All Pass)
CC-02: Room Out of Scope
CC-03: Holiday Blocked
CC-07: Room Conflict
CC-08: Lecturer Conflict
CC-09: Capacity Fail
CC-10: Software Missing
CC-11: Room Not Available (maintenance)
CC-04/05/06: Validation Error, No Token (401), Wrong Role (403)

Lưu ý quan trọng: Các test conflict (CC-07, CC-08, 5.2) phải chạy sau 5.1 để có dữ liệu draft trong DB.